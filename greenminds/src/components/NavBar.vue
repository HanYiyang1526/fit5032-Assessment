<script setup>
import { logout } from '../composables/useAuth.js'

const props = defineProps({
  currentPage: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['navigate'])

const navItems = [
  { key: 'home', label: 'Home' },
  { key: 'resources', label: 'Educational Resources' },
  { key: 'contact', label: 'Contact / Newsletter' }
]

function go(page) {
  emit('navigate', page)
}

function handleLogout() {
  logout()
  emit('navigate', 'home')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
    <div class="container">
      <a class="navbar-brand" href="#" @click.prevent="go('home')">
        GreenMinds Australia
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#gmNavbar"
        aria-controls="gmNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="gmNavbar">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
          <li class="nav-item" v-for="item in navItems" :key="item.key">
            <a
              class="nav-link"
              :class="{ active: currentPage === item.key }"
              href="#"
              @click.prevent="go(item.key)"
            >
              {{ item.label }}
            </a>
          </li>
          <li class="nav-item" v-if="!currentUser">
            <a
              class="nav-link"
              :class="{ active: currentPage === 'login' }"
              href="#"
              @click.prevent="go('login')"
            >
              Login / Register
            </a>
          </li>
          <li class="nav-item d-flex align-items-center ms-lg-2" v-else>
            <span class="text-muted small me-2">
              {{ currentUser.displayName }} ({{ currentUser.role }})
            </span>
            <button class="btn btn-sm btn-outline-secondary" @click="handleLogout">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
