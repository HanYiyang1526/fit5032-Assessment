<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'

// BR (D.3) Interactive table data: every table built from this component
// supports column sorting, a global search, a search box per column, and
// pagination fixed at 10 rows per page.
const props = defineProps({
  tableId: { type: String, required: true },
  caption: { type: String, required: true },
  rows: { type: Array, required: true },
  // [{ field, header }]
  columns: { type: Array, required: true },
  dataKey: { type: String, default: 'id' }
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

// Exposed so a parent can export exactly what the user is looking at.
const table = ref(null)
defineExpose({ table })
</script>

<template>
  <DataTable
    ref="table"
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
    class="gm-table"
  >
    <template #header>
      <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <h3 class="h6 mb-0">{{ caption }}</h3>
        <div class="d-flex gap-2">
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
        </div>
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
