<script setup>
import { computed, ref } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js'
import InteractiveTable from './InteractiveTable.vue'
import BulkEmailPanel from './BulkEmailPanel.vue'
import { useUsers } from '../composables/useUsers.js'
import events from '../data/events.json'
import schools from '../data/schools.json'
import resources from '../data/resources.json'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

// BR (F.1) Innovation — Admin Dashboard: an overview of the site for the
// charity's admin (user numbers and types, sign-up trend, site content),
// with interactive charts driven by live Firestore data.
const { users, loading, error } = useUsers()

const ROLES = ['Teacher', 'Volunteer', 'Admin']
const ROLE_COLOURS = { Teacher: '#3b6d11', Volunteer: '#d97706', Admin: '#1d4ed8' }

const roleCounts = computed(() => {
  const counts = Object.fromEntries(ROLES.map((r) => [r, 0]))
  for (const u of users.value) counts[u.role] = (counts[u.role] || 0) + 1
  return counts
})

const newThisWeek = computed(() => {
  const weekAgo = Date.now() - 7 * 86400000
  return users.value.filter((u) => u.createdAt && u.createdAt.getTime() >= weekAgo).length
})

const stats = computed(() => [
  { label: 'Total users', value: users.value.length },
  { label: 'Teachers', value: roleCounts.value.Teacher },
  { label: 'Volunteers', value: roleCounts.value.Volunteer },
  { label: 'Admins', value: roleCounts.value.Admin },
  { label: 'New in last 7 days', value: newThisWeek.value }
])

const contentStats = [
  { label: 'Educational resources', value: resources.length },
  { label: 'Volunteer events', value: events.length },
  { label: 'Partner schools', value: schools.length }
]

// --- Chart 1: users by role (click a slice to filter the users table) ---
const usersTable = ref(null)
const roleFilter = ref('')

const roleChartData = computed(() => ({
  labels: ROLES,
  datasets: [
    {
      data: ROLES.map((r) => roleCounts.value[r]),
      backgroundColor: ROLES.map((r) => ROLE_COLOURS[r])
    }
  ]
}))

const roleChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  onClick: (_event, elements) => {
    if (!elements.length) return
    filterByRole(ROLES[elements[0].index])
  }
}

function filterByRole(role) {
  roleFilter.value = role
  usersTable.value?.setColumnFilter('role', role || null)
}

// --- Chart 2: sign-ups per day over a chosen range ---
const rangeDays = ref(30)

const signupChartData = computed(() => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = rangeDays.value - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }
  const key = (d) => d.toISOString().slice(0, 10)
  const counts = Object.fromEntries(days.map((d) => [key(d), 0]))
  for (const u of users.value) {
    if (!u.createdAt) continue
    const d = new Date(u.createdAt)
    d.setHours(0, 0, 0, 0)
    if (key(d) in counts) counts[key(d)]++
  }
  return {
    labels: days.map((d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })),
    datasets: [{ label: 'New users', data: Object.values(counts), backgroundColor: '#3b6d11' }]
  }
})

const signupsInRange = computed(() =>
  signupChartData.value.datasets[0].data.reduce((sum, n) => sum + n, 0)
)

const signupChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
}

// Users ticked in the table become the bulk email recipients.
const selectedUsers = ref([])

const userColumns = [
  { field: 'displayName', header: 'Name' },
  { field: 'email', header: 'Email' },
  { field: 'role', header: 'Role' },
  { field: 'joined', header: 'Joined' }
]
</script>

<template>
  <section class="container my-5">
    <h1 class="h3 mb-2">Admin Dashboard</h1>
    <p class="text-muted mb-4">
      Live overview of GreenMinds users and site content. Data updates automatically
      from Firestore.
    </p>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <p v-else-if="loading" role="status">Loading users…</p>

    <template v-else>
      <h2 class="h5 mb-3">Users</h2>
      <div class="row g-3 mb-4">
        <div v-for="stat in stats" :key="stat.label" class="col-6 col-md">
          <div class="card border-0 shadow-sm h-100 text-center">
            <div class="card-body">
              <div class="display-6 fw-bold text-gm">{{ stat.value }}</div>
              <div class="small text-muted">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h2 class="h6">Users by role</h2>
              <p class="small text-muted mb-2">Click a slice to filter the users table.</p>
              <div class="chart-box">
                <Doughnut
                  :data="roleChartData"
                  :options="roleChartOptions"
                  role="img"
                  :aria-label="`Users by role: ${ROLES.map((r) => `${r} ${roleCounts[r]}`).join(', ')}`"
                />
              </div>
              <div class="d-flex flex-wrap gap-1 mt-3" role="group" aria-label="Filter users table by role">
                <button
                  v-for="role in ['', ...ROLES]"
                  :key="role || 'all'"
                  type="button"
                  class="btn btn-sm"
                  :class="roleFilter === role ? 'btn-gm-primary' : 'btn-outline-secondary'"
                  :aria-pressed="roleFilter === role"
                  @click="filterByRole(role)"
                >
                  {{ role || 'All roles' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <h2 class="h6 mb-0">Sign-ups per day</h2>
                <div>
                  <label for="signup-range" class="visually-hidden">Date range</label>
                  <select id="signup-range" v-model.number="rangeDays" class="form-select form-select-sm">
                    <option :value="7">Last 7 days</option>
                    <option :value="30">Last 30 days</option>
                    <option :value="90">Last 90 days</option>
                  </select>
                </div>
              </div>
              <p class="small text-muted mb-2">
                {{ signupsInRange }} new user{{ signupsInRange === 1 ? '' : 's' }} in the last {{ rangeDays }} days.
              </p>
              <div class="chart-box">
                <Bar
                  :data="signupChartData"
                  :options="signupChartOptions"
                  role="img"
                  :aria-label="`Bar chart of new users per day: ${signupsInRange} in the last ${rangeDays} days`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-5">
        <div class="col-xl-8">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <InteractiveTable
                ref="usersTable"
                v-model:selection="selectedUsers"
                table-id="users"
                export-name="greenminds-users"
                caption="All users"
                :rows="users"
                :columns="userColumns"
                selectable
              />
            </div>
          </div>
        </div>
        <div class="col-xl-4">
          <BulkEmailPanel :recipients="selectedUsers" @sent="selectedUsers = []" />
        </div>
      </div>

      <h2 class="h5 mb-3">Site content</h2>
      <div class="row g-3">
        <div v-for="stat in contentStats" :key="stat.label" class="col-12 col-md-4">
          <div class="card border-0 shadow-sm h-100 text-center">
            <div class="card-body">
              <div class="display-6 fw-bold text-gm">{{ stat.value }}</div>
              <div class="small text-muted">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.chart-box {
  position: relative;
  height: 260px;
}

.text-gm {
  color: var(--gm-green-dark);
}
</style>
