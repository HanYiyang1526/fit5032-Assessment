<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import events from '../data/events.json'
import {
  TRAVEL_MODES,
  distanceKm,
  formatDistance,
  formatDuration,
  getCurrentPosition,
  getRoute,
  searchPlaces
} from '../services/geo.js'

// BR (E.2) Geo location: an interactive map of GreenMinds events with
// two features beyond plotting markers:
//   1. Search places of interest (parks, recycling centres, addresses)
//      within the visible map area, and set any of them as a start point.
//   2. Directions from a start point to any event or place, with route
//      line and trip information (distance, travel time) per travel mode.
// Events are also listed in text, sorted by distance from the start point,
// as a non-visual alternative to the map (BR E.3).

// Vite bundles images with hashed names, so point Leaflet at them.
const eventIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const mapEl = ref(null)
const map = shallowRef(null)
const eventMarkers = new Map()
let placeLayer = null
let startMarker = null
let routeLine = null

const start = ref(null) // { name, lat, lng }
const startError = ref('')
const locating = ref(false)

const placeQuery = ref('')
const places = ref([])
const searching = ref(false)
const searchMessage = ref('')

const destination = ref(null) // { name, lat, lng }
const travelMode = ref('car')
const route = ref(null) // { distance, duration }
const routing = ref(false)
const routeError = ref('')

const eventsByDistance = computed(() => {
  const list = events.map((e) => ({
    ...e,
    km: start.value ? distanceKm(start.value, e) : null
  }))
  if (start.value) list.sort((a, b) => a.km - b.km)
  return list
})

onMounted(() => {
  map.value = L.map(mapEl.value, { scrollWheelZoom: false }).setView([-37.85, 145.0], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  for (const event of events) {
    const marker = L.marker([event.lat, event.lng], { icon: eventIcon, title: event.name })
      .addTo(map.value)
      .bindPopup(() => eventPopup(event))
    eventMarkers.set(event.id, marker)
  }

  placeLayer = L.layerGroup().addTo(map.value)
})

onBeforeUnmount(() => {
  map.value?.remove()
})

// Popups are built as DOM nodes so their buttons can call into Vue.
function eventPopup(event) {
  const el = document.createElement('div')
  const spots = event.capacity - event.registered
  el.innerHTML = `<strong></strong><br><span class="text-muted small"></span><br>`
  el.querySelector('strong').textContent = event.name
  el.querySelector('span').textContent =
    `${event.date} · ${spots > 0 ? `${spots} spots left` : 'Fully booked'}`
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'btn btn-sm btn-gm-primary mt-2'
  btn.textContent = 'Directions here'
  btn.addEventListener('click', () => directionsTo(event))
  el.appendChild(btn)
  return el
}

function setStart(point) {
  start.value = point
  startError.value = ''
  startMarker?.remove()
  startMarker = L.circleMarker([point.lat, point.lng], {
    radius: 9,
    color: '#1d4ed8',
    fillColor: '#3b82f6',
    fillOpacity: 0.9
  })
    .addTo(map.value)
    .bindTooltip(`Start: ${point.name}`)
  map.value.setView([point.lat, point.lng], 12)
  if (destination.value) calculateRoute()
}

async function useMyLocation() {
  locating.value = true
  startError.value = ''
  try {
    const pos = await getCurrentPosition()
    setStart({ name: 'My location', ...pos })
  } catch (err) {
    startError.value = `${err.message} You can search for a place and use it as your start instead.`
  } finally {
    locating.value = false
  }
}

async function runPlaceSearch() {
  const query = placeQuery.value.trim()
  if (!query) return
  searching.value = true
  searchMessage.value = ''
  try {
    places.value = await searchPlaces(query, map.value.getBounds())
    if (!places.value.length) {
      // Nothing in view: widen the search to the whole country.
      places.value = await searchPlaces(query)
    }
    searchMessage.value = places.value.length
      ? `${places.value.length} place${places.value.length === 1 ? '' : 's'} found.`
      : 'No places found. Try a different search.'
    showPlaces()
  } catch (err) {
    searchMessage.value = err.message
  } finally {
    searching.value = false
  }
}

function showPlaces() {
  placeLayer.clearLayers()
  const points = []
  for (const place of places.value) {
    L.circleMarker([place.lat, place.lng], {
      radius: 7,
      color: '#b45309',
      fillColor: '#f59e0b',
      fillOpacity: 0.9
    })
      .addTo(placeLayer)
      .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br><span class="small">${escapeHtml(place.address)}</span>`)
    points.push([place.lat, place.lng])
  }
  if (points.length) map.value.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function focusEvent(event) {
  map.value.setView([event.lat, event.lng], 14)
  eventMarkers.get(event.id)?.openPopup()
  mapEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function focusPlace(place) {
  map.value.setView([place.lat, place.lng], 15)
}

async function directionsTo(target) {
  destination.value = { name: target.name, lat: target.lat, lng: target.lng }
  if (!start.value) {
    await useMyLocation()
    if (!start.value) {
      routeError.value = 'Set a starting point first (use your location or a searched place).'
      return
    }
  }
  calculateRoute()
}

async function calculateRoute() {
  if (!start.value || !destination.value) return
  routing.value = true
  routeError.value = ''
  route.value = null
  try {
    const result = await getRoute(start.value, destination.value, travelMode.value)
    route.value = result
    routeLine?.remove()
    routeLine = L.polyline(result.path, { color: '#3b6d11', weight: 5, opacity: 0.85 }).addTo(map.value)
    map.value.fitBounds(routeLine.getBounds(), { padding: [40, 40] })
  } catch (err) {
    routeError.value = err.message
  } finally {
    routing.value = false
  }
}

function clearRoute() {
  routeLine?.remove()
  routeLine = null
  route.value = null
  destination.value = null
  routeError.value = ''
}

const modeLabel = computed(() => TRAVEL_MODES.find((m) => m.key === travelMode.value).label)
</script>

<template>
  <section class="container my-5">
    <h1 class="h3 mb-2">Event Map</h1>
    <p class="text-muted mb-4">
      Find GreenMinds events near you, search for places such as parks or recycling
      centres, and get directions with travel time.
    </p>

    <div class="row g-4">
      <div class="col-lg-8">
        <div
          ref="mapEl"
          class="gm-map rounded shadow-sm"
          role="region"
          aria-label="Map of GreenMinds events. The same events are listed below the map."
        ></div>
        <p class="small text-muted mt-2 mb-0">
          <span class="legend-dot" style="background:#3b82f6"></span> Start point
          <span class="legend-dot ms-3" style="background:#f59e0b"></span> Search results
          <span class="ms-3">📍 GreenMinds events</span>
        </p>
      </div>

      <div class="col-lg-4">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h2 class="h6">1. Starting point</h2>
            <button
              type="button"
              class="btn btn-sm btn-gm-primary"
              :disabled="locating"
              @click="useMyLocation"
            >
              {{ locating ? 'Locating…' : 'Use my location' }}
            </button>
            <p class="small mb-0 mt-2" role="status" aria-live="polite">
              <span v-if="start">Start: <strong>{{ start.name }}</strong></span>
              <span v-else class="text-muted">No start point set.</span>
            </p>
            <p v-if="startError" class="small text-danger mb-0 mt-1">{{ startError }}</p>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-3">
          <div class="card-body">
            <h2 class="h6">2. Search places</h2>
            <form class="d-flex gap-2" role="search" @submit.prevent="runPlaceSearch">
              <label for="place-search" class="visually-hidden">Search places in the map area</label>
              <input
                id="place-search"
                v-model="placeQuery"
                type="search"
                class="form-control form-control-sm"
                placeholder="e.g. recycling centre, park"
              />
              <button type="submit" class="btn btn-sm btn-outline-secondary" :disabled="searching">
                {{ searching ? '…' : 'Search' }}
              </button>
            </form>
            <p class="small text-muted mt-2 mb-1" role="status" aria-live="polite">{{ searchMessage }}</p>
            <ul class="list-unstyled small mb-0 place-list">
              <li v-for="place in places" :key="place.id" class="border-top py-2">
                <div class="fw-semibold">{{ place.name }}</div>
                <div class="text-muted text-truncate" :title="place.address">{{ place.address }}</div>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <button type="button" class="btn btn-link btn-sm p-0 me-2" @click="focusPlace(place)">
                    Show
                  </button>
                  <button type="button" class="btn btn-link btn-sm p-0 me-2" @click="setStart(place)">
                    Start here
                  </button>
                  <button type="button" class="btn btn-link btn-sm p-0" @click="directionsTo(place)">
                    Directions
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h2 class="h6">3. Directions</h2>
            <label for="travel-mode" class="form-label small mb-1">Travel mode</label>
            <select
              id="travel-mode"
              v-model="travelMode"
              class="form-select form-select-sm mb-2"
              @change="calculateRoute"
            >
              <option v-for="mode in TRAVEL_MODES" :key="mode.key" :value="mode.key">
                {{ mode.label }}
              </option>
            </select>
            <div role="status" aria-live="polite" class="small">
              <p v-if="!destination" class="text-muted mb-0">
                Choose "Directions" on an event or place.
              </p>
              <template v-else>
                <p class="mb-1">To: <strong>{{ destination.name }}</strong></p>
                <p v-if="routing" class="mb-0">Calculating route…</p>
                <div v-else-if="route" class="trip-info">
                  <div><span class="text-muted">Distance:</span> {{ formatDistance(route.distance) }}</div>
                  <div><span class="text-muted">{{ modeLabel }} time:</span> {{ formatDuration(route.duration) }}</div>
                </div>
              </template>
              <p v-if="routeError" class="text-danger mb-0 mt-1">{{ routeError }}</p>
            </div>
            <button
              v-if="destination"
              type="button"
              class="btn btn-sm btn-outline-secondary mt-2"
              @click="clearRoute"
            >
              Clear route
            </button>
          </div>
        </div>
      </div>
    </div>

    <h2 class="h5 mt-5 mb-3">
      {{ start ? `Events nearest to ${start.name}` : 'All events' }}
    </h2>
    <ul class="list-group shadow-sm event-list">
      <li
        v-for="event in eventsByDistance"
        :key="event.id"
        class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2"
      >
        <div>
          <div class="fw-semibold">{{ event.name }}</div>
          <div class="small text-muted">
            {{ event.date }} · {{ event.type }}
            <span v-if="event.km !== null"> · {{ event.km.toFixed(1) }} km away</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="focusEvent(event)">
            Show on map
          </button>
          <button type="button" class="btn btn-sm btn-gm-primary" @click="directionsTo(event)">
            Directions
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.gm-map {
  height: 520px;
  z-index: 0;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;
}

.place-list {
  max-height: 260px;
  overflow-y: auto;
}

.event-list {
  max-height: 480px;
  overflow-y: auto;
}

.trip-info {
  font-size: 1rem;
}
</style>
