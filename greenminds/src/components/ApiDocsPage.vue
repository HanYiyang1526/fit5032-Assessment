<script setup>
import { reactive } from 'vue'

// BR (F.1) Innovation — Provide API access: documentation for the public
// read-only REST API, with a "Try it" button that calls each route live.
const origin = window.location.origin

const endpoints = [
  {
    id: 'events',
    method: 'GET',
    path: '/api/v1/events',
    summary: 'Upcoming volunteer events, sorted by date.',
    params: [
      ['suburb', 'Suburb contains this text, e.g. Clayton'],
      ['type', 'Event type contains this text, e.g. Tree Planting'],
      ['from', 'Only events on or after this date (YYYY-MM-DD)'],
      ['to', 'Only events on or before this date (YYYY-MM-DD)'],
      ['available', 'true = only events with spots left'],
      ['limit', 'Results per page, 1–100 (default 20)'],
      ['offset', 'Number of results to skip (default 0)']
    ],
    example: '/api/v1/events?suburb=Clayton&available=true&limit=5'
  },
  {
    id: 'event',
    method: 'GET',
    path: '/api/v1/events/{id}',
    summary: 'A single event by its id.',
    params: [],
    example: '/api/v1/events/1'
  },
  {
    id: 'resources',
    method: 'GET',
    path: '/api/v1/resources',
    summary: 'Educational resources, newest first.',
    params: [
      ['audience', 'Teachers, Families or Volunteers'],
      ['topic', 'Topic contains this text, e.g. Biodiversity'],
      ['format', 'Format contains this text, e.g. Lesson Plan'],
      ['q', 'Title contains this text'],
      ['limit', 'Results per page, 1–100 (default 20)'],
      ['offset', 'Number of results to skip (default 0)']
    ],
    example: '/api/v1/resources?audience=Teachers'
  }
]

const results = reactive({})

async function tryIt(endpoint) {
  results[endpoint.id] = { loading: true, status: '', body: '' }
  try {
    const response = await fetch(endpoint.example)
    const text = await response.text()
    let body = text
    try {
      body = JSON.stringify(JSON.parse(text), null, 2)
    } catch (err) {
      // Not JSON (e.g. the functions server is not running locally).
    }
    results[endpoint.id] = { loading: false, status: `${response.status} ${response.statusText}`, body }
  } catch (err) {
    results[endpoint.id] = { loading: false, status: 'Network error', body: err.message }
  }
}
</script>

<template>
  <section class="container my-5" style="max-width: 900px;">
    <h1 class="h3 mb-2">GreenMinds Public API</h1>
    <p class="text-muted">
      Partner schools, councils and other organisations can fetch GreenMinds data
      with simple REST requests. The API is read-only, needs no key, returns JSON and
      allows cross-origin requests (CORS).
    </p>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h2 class="h6">Response format</h2>
        <p class="small mb-2">
          List routes return the matching items plus paging details. Errors return an
          <code>error</code> object with an HTTP status code (400 bad input, 404 not found,
          405 method not allowed).
        </p>
        <pre class="api-pre mb-0"><code>{
  "data": [ ... ],
  "meta": { "total": 3, "limit": 20, "offset": 0 }
}</code></pre>
      </div>
    </div>

    <div v-for="endpoint in endpoints" :key="endpoint.id" class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h2 class="h5">
          <span class="badge bg-success me-2">{{ endpoint.method }}</span>
          <code>{{ endpoint.path }}</code>
        </h2>
        <p class="mb-3">{{ endpoint.summary }}</p>

        <table v-if="endpoint.params.length" class="table table-sm small">
          <caption class="visually-hidden">Query parameters for {{ endpoint.path }}</caption>
          <thead>
            <tr>
              <th scope="col">Query parameter</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[name, description] in endpoint.params" :key="name">
              <td><code>{{ name }}</code></td>
              <td>{{ description }}</td>
            </tr>
          </tbody>
        </table>

        <p class="small mb-2">
          Example: <code class="text-break">{{ origin }}{{ endpoint.example }}</code>
        </p>
        <button
          type="button"
          class="btn btn-sm btn-gm-primary"
          :disabled="results[endpoint.id]?.loading"
          @click="tryIt(endpoint)"
        >
          {{ results[endpoint.id]?.loading ? 'Loading…' : 'Try it' }}
        </button>

        <div v-if="results[endpoint.id] && !results[endpoint.id].loading" class="mt-3" aria-live="polite">
          <p class="small mb-1">Status: <strong>{{ results[endpoint.id].status }}</strong></p>
          <pre class="api-pre" tabindex="0" :aria-label="`Response from ${endpoint.example}`"><code>{{ results[endpoint.id].body }}</code></pre>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.api-pre {
  background: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  max-height: 360px;
  overflow: auto;
  font-size: 0.8rem;
}
</style>
