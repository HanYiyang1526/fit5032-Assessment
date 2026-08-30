<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import resourcesData from '../data/resources.json'

// BR (B.2) Dynamic Data: resources are loaded from an underlying JSON
// data structure and rendered dynamically with v-for below.
const resources = ref(resourcesData)

const searchText = ref('')
const audienceFilter = ref('All')

const audiences = ['All', 'Teachers', 'Families', 'Volunteers']

// BR (B.2) Dynamic Data: saved resource ids are persisted to
// localStorage so the list survives beyond the current session.
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
