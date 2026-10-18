<script setup>
import InteractiveTable from './InteractiveTable.vue'
import events from '../data/events.json'
import schools from '../data/schools.json'

// BR (D.3) Two interactive tables: upcoming volunteer events and partner
// schools. Data is mock data in the shape a Mockaroo export would produce.
const eventColumns = [
  { field: 'name', header: 'Event' },
  { field: 'type', header: 'Type' },
  { field: 'suburb', header: 'Suburb' },
  { field: 'date', header: 'Date' },
  { field: 'capacity', header: 'Capacity' },
  { field: 'registered', header: 'Registered' }
]

const schoolColumns = [
  { field: 'name', header: 'School' },
  { field: 'suburb', header: 'Suburb' },
  { field: 'program', header: 'Program' },
  { field: 'students', header: 'Students' },
  { field: 'contact', header: 'Contact' },
  { field: 'joined', header: 'Joined' }
]
</script>

<template>
  <section class="container my-5">
    <h1 class="h3 mb-2">Events &amp; Partner Schools</h1>
    <p class="text-muted mb-4">
      Browse upcoming GreenMinds volunteer events and the schools taking part in our
      programs. Click a column heading to sort, or use the search boxes to filter.
    </p>

    <div class="card border-0 shadow-sm mb-5">
      <div class="card-body">
        <InteractiveTable
          table-id="events"
          caption="Upcoming volunteer events"
          :rows="events"
          :columns="eventColumns"
        />
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <InteractiveTable
          table-id="schools"
          caption="Partner schools"
          :rows="schools"
          :columns="schoolColumns"
        />
      </div>
    </div>
  </section>
</template>
