<script setup>
defineProps({
  currentPage: {
    type: String,
    required: true
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
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
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
        </ul>
      </div>
    </div>
  </nav>
</template>
