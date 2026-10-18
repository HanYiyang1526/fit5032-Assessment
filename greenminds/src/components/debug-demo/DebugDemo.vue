<script setup>
import { ref } from 'vue'
import ResourceDetail from './ResourceDetail.vue'

const selectedId = ref(1)
const ids = [1, 2, 3, 4, 5, 6, 7, 8, 99]
</script>

<template>
  <section class="container my-5">
    <h2 class="h4">Resource Detail Preview</h2>
    <div class="btn-group flex-wrap">
      <button
        v-for="id in ids"
        :key="id"
        class="btn btn-sm"
        :class="selectedId === id ? 'btn-gm-primary' : 'btn-outline-secondary'"
        @click="selectedId = id"
      >
        #{{ id }}
      </button>
    </div>
    <ResourceDetail :resource-id="selectedId" />
  </section>
</template>
