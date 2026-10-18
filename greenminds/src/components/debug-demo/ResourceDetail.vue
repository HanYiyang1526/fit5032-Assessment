<script setup>
import { ref, watch } from 'vue'
import resourcesData from '../../data/resources.json'

const props = defineProps({
  resourceId: {
    type: Number,
    required: true
  }
})

const resource = ref(null)
const loading = ref(false)

// Simulates fetching one resource from an API with variable network latency
function fetchResource(id) {
  return new Promise((resolve) => {
    const delay = 300 + Math.random() * 1200
    setTimeout(() => {
      resolve(resourcesData.find((r) => r.id === id))
    }, delay)
  })
}

watch(
  () => props.resourceId,
  async (id) => {
    loading.value = true
    resource.value = await fetchResource(id)
    loading.value = false
  },
  { immediate: true }
)
</script>

<template>
  <div class="card border-0 shadow-sm mt-3">
    <div class="card-body">
      <p v-if="loading" class="text-muted small">Loading...</p>
      <h5 class="card-title">{{ resource.title }}</h5>
      <p class="text-muted mb-0">
        {{ resource.audience }} · {{ resource.format }} · Added {{ resource.dateAdded }}
      </p>
    </div>
  </div>
</template>
