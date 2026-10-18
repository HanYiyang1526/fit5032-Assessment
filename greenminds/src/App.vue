<script setup>
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import HomePage from './components/HomePage.vue'
import ResourcesPage from './components/ResourcesPage.vue'
import ContactPage from './components/ContactPage.vue'
import LoginPage from './components/LoginPage.vue'
import { currentUser, initAuth } from './composables/useAuth.js'
import DebugDemo from './components/debug-demo/DebugDemo.vue'

const currentPage = ref('home')

onMounted(() => {
  initAuth()
})

function navigate(page) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <NavBar
    :current-page="currentPage"
    :current-user="currentUser"
    @navigate="navigate"
  />

  <HomePage
    v-if="currentPage === 'home'"
    :current-user="currentUser"
    @navigate="navigate"
  />
  <ResourcesPage v-else-if="currentPage === 'resources'" />
  <ContactPage v-else-if="currentPage === 'contact'" />
  <LoginPage v-else-if="currentPage === 'login'" @navigate="navigate" />

  <footer class="bg-white border-top py-4 mt-5">
    <div class="container text-center text-muted small">
      &copy; 2026 GreenMinds Australia. All rights reserved.
    </div>
  </footer>
</template>
