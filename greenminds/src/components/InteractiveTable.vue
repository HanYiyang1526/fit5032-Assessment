<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'
import { currentUser } from '../composables/useAuth.js'
import { apiPost } from '../services/api.js'
import { toBase64, toCsv } from '../utils/csv.js'
import { downloadCsv, downloadPdf } from '../utils/download.js'

// BR (D.3) Interactive table data: every table built from this component
// supports column sorting, a global search, a search box per column, and
// pagination fixed at 10 rows per page.
const props = defineProps({
  tableId: { type: String, required: true },
  caption: { type: String, required: true },
  rows: { type: Array, required: true },
  // [{ field, header }]
  columns: { type: Array, required: true },
  dataKey: { type: String, default: 'id' },
  // Base name for exported files, e.g. 'greenminds-events'
  exportName: { type: String, required: true }
})

function buildFilters() {
  const filters = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
  for (const col of props.columns) {
    filters[col.field] = { value: null, matchMode: FilterMatchMode.CONTAINS }
  }
  return filters
}

const filters = ref(buildFilters())

function clearFilters() {
  filters.value = buildFilters()
}

// The rows currently shown after search and sort (all pages), so exports
// match what the user is looking at.
const visibleRows = ref(props.rows)

// BR (E.4) Export the current table view as CSV or PDF.
const exportingPdf = ref(false)

function exportCsv() {
  downloadCsv(visibleRows.value, props.columns, `${props.exportName}.csv`)
}

async function exportPdf() {
  exportingPdf.value = true
  try {
    await downloadPdf(visibleRows.value, props.columns, {
      title: props.caption,
      filename: `${props.exportName}.pdf`
    })
  } finally {
    exportingPdf.value = false
  }
}

// BR (D.2) Email the current table view to the logged-in user as a CSV
// attachment, via the /api/send-email serverless function (BR E.1).
const emailStatus = ref({ type: '', text: '' })
const sending = ref(false)

async function emailCsv() {
  sending.value = true
  emailStatus.value = { type: '', text: '' }
  try {
    const csv = toCsv(visibleRows.value, props.columns)
    const result = await apiPost('/api/send-email', {
      subject: `GreenMinds: ${props.caption}`,
      message: `Attached are the ${visibleRows.value.length} records you requested from "${props.caption}".`,
      attachment: { filename: `${props.exportName}.csv`, content: toBase64(csv) }
    })
    emailStatus.value = { type: 'success', text: `Sent to ${result.sentTo}.` }
  } catch (err) {
    emailStatus.value = { type: 'danger', text: err.message }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="rows"
    :data-key="dataKey"
    :global-filter-fields="columns.map((c) => c.field)"
    filter-display="row"
    paginator
    :rows="10"
    removable-sort
    striped-rows
    size="small"
    table-style="min-width: 52rem"
    :aria-label="caption"
    :pt="{ pcPaginator: { paginatorContainer: { 'aria-label': `${caption} pages` } } }"
    class="gm-table"
    @value-change="(value) => (visibleRows = value)"
  >
    <template #header>
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <h2 class="h6 mb-0">{{ caption }}</h2>
        <div class="d-flex flex-wrap gap-2">
          <label :for="`${tableId}-global`" class="visually-hidden">
            Search all columns of {{ caption }}
          </label>
          <InputText
            :id="`${tableId}-global`"
            v-model="filters.global.value"
            placeholder="Search all columns"
            size="small"
          />
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearFilters">
            Clear
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="exportCsv">
            Download CSV
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="exportingPdf"
            @click="exportPdf"
          >
            {{ exportingPdf ? 'Preparing…' : 'Download PDF' }}
          </button>
          <button
            v-if="currentUser"
            type="button"
            class="btn btn-sm btn-gm-primary"
            :disabled="sending"
            @click="emailCsv"
          >
            {{ sending ? 'Sending…' : 'Email me as CSV' }}
          </button>
        </div>
      </div>
      <div
        class="small mt-2"
        :class="emailStatus.type ? `text-${emailStatus.type}` : ''"
        role="status"
        aria-live="polite"
      >
        {{ emailStatus.text }}
      </div>
    </template>

    <template #empty>No records match your search.</template>

    <Column
      v-for="col in columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      sortable
      :show-filter-menu="false"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          class="w-100"
          :placeholder="`Search ${col.header.toLowerCase()}`"
          :aria-label="`Search by ${col.header}`"
          @input="filterCallback()"
        />
      </template>
    </Column>
  </DataTable>
</template>
