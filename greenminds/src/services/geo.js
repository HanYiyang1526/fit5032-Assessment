// BR (E.2) Geo location helpers built on free OpenStreetMap services:
// Nominatim for place search / geocoding and the FOSSGIS OSRM servers for
// routing. Neither needs an API key.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const ROUTING_URL = 'https://routing.openstreetmap.de'

// OSRM profiles hosted by routing.openstreetmap.de
export const TRAVEL_MODES = [
  { key: 'car', label: 'Driving' },
  { key: 'bike', label: 'Cycling' },
  { key: 'foot', label: 'Walking' }
]

// Search places of interest. When `bounds` (a Leaflet LatLngBounds) is
// given, results are limited to the area currently shown on the map.
export async function searchPlaces(query, bounds) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '8',
    countrycodes: 'au',
    addressdetails: '0',
    'accept-language': 'en'
  })
  if (bounds) {
    params.set(
      'viewbox',
      [bounds.getWest(), bounds.getNorth(), bounds.getEast(), bounds.getSouth()].join(',')
    )
    params.set('bounded', '1')
  }

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) throw new Error('Place search is unavailable right now.')
  const results = await response.json()
  return results.map((r) => ({
    id: r.place_id,
    name: r.name || r.display_name.split(',')[0],
    address: r.display_name,
    type: r.type,
    lat: Number(r.lat),
    lng: Number(r.lon)
  }))
}

// Route between two { lat, lng } points. Returns distance (m), duration (s)
// and the path as [[lat, lng], ...] ready for a Leaflet polyline.
export async function getRoute(from, to, mode = 'car') {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${ROUTING_URL}/routed-${mode}/route/v1/driving/${coords}?overview=full&geometries=geojson`

  const response = await fetch(url)
  if (!response.ok) throw new Error('Routing is unavailable right now.')
  const data = await response.json()
  if (data.code !== 'Ok' || !data.routes.length) {
    throw new Error('No route found between those places.')
  }

  const route = data.routes[0]
  return {
    distance: route.distance,
    duration: route.duration,
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  }
}

// Straight-line distance in km (haversine formula).
export function distanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function formatDistance(metres) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`
}

export function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location access.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location access was denied or is unavailable.')),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  })
}
