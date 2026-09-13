<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import resourcesData from '../data/resources.json'
import { currentUser } from '../composables/useAuth.js'
import { sanitizeText } from '../utils/security.js'

// BR (B.2) Dynamic Data: resources are loaded from an underlying JSON
// data structure and rendered dynamically with v-for below.
const resources = ref(resourcesData)

const searchText = ref('')
const audienceFilter = ref('All')
const audiences = ['All', 'Teachers', 'Families', 'Volunteers']

// ----- Saved resources (BR B.2 localStorage persistence) -----
const STORAGE_KEY = 'gm_saved_resources'
const savedIds = ref([])

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      savedIds.value = JSON.parse(stored)
    } catch (e) {
      savedIds.value = []
    }
  }
})

watch(
  savedIds,
  (newVal) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
  },
  { deep: true }
)

function toggleSave(id) {
  if (savedIds.value.includes(id)) {
    savedIds.value = savedIds.value.filter((savedId) => savedId !== id)
  } else {
    savedIds.value = [...savedIds.value, id]
  }
}

function isSaved(id) {
  return savedIds.value.includes(id)
}

// ----- Ratings (BR C.3 aggregated rating score) -----
const RATINGS_KEY = 'gm_ratings'
const ratings = ref({}) // { [resourceId]: [ { userId, username, stars, comment } ] }
const draftStars = reactive({}) // resourceId -> selected star while composing
const draftComment = reactive({}) // resourceId -> comment text while composing

onMounted(() => {
  const stored = localStorage.getItem(RATINGS_KEY)
  if (stored) {
    try {
      ratings.value = JSON.parse(stored)
    } catch (e) {
      ratings.value = {}
    }
  }
})

watch(
  ratings,
  (newVal) => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(newVal))
  },
  { deep: true }
)

function ratingsFor(resourceId) {
  return ratings.value[resourceId] || []
}

function averageRating(resourceId) {
  const entries = ratingsFor(resourceId)
  if (entries.length === 0) return null
  const total = entries.reduce((sum, r) => sum + r.stars, 0)
  return (total / entries.length).toFixed(1)
}

function myRating(resourceId) {
  if (!currentUser.value) return null
  return ratingsFor(resourceId).find((r) => r.userId === currentUser.value.id) || null
}

function setDraftStars(resourceId, stars) {
  draftStars[resourceId] = stars
}

// BR (C.4) Security: any free-text comment is passed through
// sanitizeText() before being stored, stripping HTML/script tags so a
// malicious comment cannot be rendered back as executable markup for
// other users viewing the resource (defence against stored XSS).
function submitRating(resourceId) {
  if (!currentUser.value) return
  const stars = draftStars[resourceId]
  if (!stars) return

  const comment = sanitizeText(draftComment[resourceId] || '')
  const entries = ratingsFor(resourceId).filter(
    (r) => r.userId !== currentUser.value.id
  )
  entries.push({
    userId: currentUser.value.id,
    username: currentUser.value.displayName,
    stars,
    comment
  })
  ratings.value = { ...ratings.value, [resourceId]: entries }
  draftComment[resourceId] = ''
}

// ----- Search / filter -----
const filteredResources = computed(() => {
  return resources.value.filter((r) => {
    const matchesAudience =
      audienceFilter.value === 'All' || r.audience === audienceFilter.value
    const matchesSearch = r.title
      .toLowerCase()
      .includes(searchText.value.toLowerCase())
    return matchesAudience && matchesSearch
  })
})

const savedResources = computed(() =>
  resources.value.filter((r) => savedIds.value.includes(r.id))
)
</script>

<template>
  <section class="container my-5">
    <h2 class="mb-3">Educational Resources</h2>
    <p class="text-muted">
      Browse curriculum-aligned lesson plans, family activities, and
      volunteer guides. Data below is loaded dynamically from a JSON
      resource list.
    </p>

    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <label for="search" class="form-label">Search by title</label>
        <input
          id="search"
          v-model="searchText"
          type="text"
          class="form-control"
          placeholder="e.g. climate, composting, biodiversity..."
        />
      </div>
      <div class="col-12 col-md-6">
        <label for="audience" class="form-label">Filter by audience</label>
        <select id="audience" v-model="audienceFilter" class="form-select">
          <option v-for="a in audiences" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
    </div>

    <p class="text-muted">
      Showing {{ filteredResources.length }} of {{ resources.length }}
      resources
    </p>

    <div class="row g-4">
      <div
        class="col-12 col-md-6 col-lg-4"
        v-for="resource in filteredResources"
        :key="resource.id"
      >
        <div class="card resource-card border-0 shadow-sm">
          <div class="card-body d-flex flex-column">
            <span class="badge badge-audience mb-2 align-self-start">
              {{ resource.audience }}
            </span>
            <h5 class="card-title">{{ resource.title }}</h5>
            <p class="card-text text-muted mb-1">
              Topic: {{ resource.topic }}
            </p>
            <p class="card-text text-muted">Format: {{ resource.format }}</p>

            <!-- BR (C.3) Rating: aggregated average score -->
            <div class="mb-2">
              <span v-if="averageRating(resource.id)">
                ⭐ {{ averageRating(resource.id) }} / 5
                <span class="text-muted small">
                  ({{ ratingsFor(resource.id).length }} rating{{ ratingsFor(resource.id).length === 1 ? '' : 's' }})
                </span>
              </span>
              <span v-else class="text-muted small">No ratings yet</span>
            </div>

            <div class="mb-3" v-if="currentUser">
              <div>
                <span
                  v-for="n in 5"
                  :key="n"
                  class="star-rating"
                  :class="{ filled: n <= (draftStars[resource.id] || (myRating(resource.id) ? myRating(resource.id).stars : 0)) }"
                  @click="setDraftStars(resource.id, n)"
                >
                  &#9733;
                </span>
              </div>
              <input
                v-model="draftComment[resource.id]"
                type="text"
                class="form-control form-control-sm mt-1"
                placeholder="Optional comment"
              />
              <button
                class="btn btn-sm btn-outline-primary mt-1"
                @click="submitRating(resource.id)"
              >
                {{ myRating(resource.id) ? 'Update rating' : 'Submit rating' }}
              </button>
            </div>
            <p class="text-muted small" v-else>
              Login to rate this resource.
            </p>

            <button
              class="btn btn-sm mt-auto"
              :class="isSaved(resource.id) ? 'btn-gm-primary' : 'btn-outline-secondary'"
              @click="toggleSave(resource.id)"
            >
              {{ isSaved(resource.id) ? 'Saved' : 'Save resource' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredResources.length === 0" class="col-12">
        <p class="text-muted">No resources match your search or filter.</p>
      </div>
    </div>

    <div v-if="savedResources.length > 0" class="mt-5">
      <h3 class="h5">My saved resources</h3>
      <ul class="list-group">
        <li
          class="list-group-item d-flex justify-content-between align-items-center"
          v-for="resource in savedResources"
          :key="resource.id"
        >
          {{ resource.title }}
          <button
            class="btn btn-sm btn-outline-danger"
            @click="toggleSave(resource.id)"
          >
            Remove
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
