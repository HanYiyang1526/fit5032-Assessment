<script setup>
import { ref, onMounted, nextTick } from 'vue'
import NavBar from './components/NavBar.vue'
import HomePage from './components/HomePage.vue'
import ResourcesPage from './components/ResourcesPage.vue'
import ContactPage from './components/ContactPage.vue'
import LoginPage from './components/LoginPage.vue'
import DirectoryPage from './components/DirectoryPage.vue'
import MapPage from './components/MapPage.vue'
import AdminDashboard from './components/AdminDashboard.vue'
import ApiDocsPage from './components/ApiDocsPage.vue'
import { currentUser, initAuth } from './composables/useAuth.js'
import DebugDemo from './components/debug-demo/DebugDemo.vue'

const currentPage = ref('home')
const mainEl = ref(null)

const PAGE_TITLES = {
  home: 'Home',
  resources: 'Educational Resources',
  directory: 'Events & Schools',
  map: 'Event Map',
  contact: 'Contact',
  login: 'Login / Register',
  admin: 'Admin Dashboard',
  api: 'Developer API'
}

onMounted(() => {
  initAuth()
})

// BR (E.3) Accessibility: on each in-app page change, update the document
// title and move keyboard/screen-reader focus to the new page content.
async function navigate(page) {
  currentPage.value = page
  document.title = `${PAGE_TITLES[page]} | GreenMinds Australia`
  window.scrollTo({ top: 0 })
  await nextTick()
  mainEl.value?.focus({ preventScroll: true })
}
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <NavBar
    :current-page="currentPage"
    :current-user="currentUser"
    @navigate="navigate"
  />

  <main id="main-content" ref="mainEl" tabindex="-1">
    <HomePage
      v-if="currentPage === 'home'"
      :current-user="currentUser"
      @navigate="navigate"
    />
    <ResourcesPage v-else-if="currentPage === 'resources'" />
    <DirectoryPage v-else-if="currentPage === 'directory'" />
    <MapPage v-else-if="currentPage === 'map'" />
    <ContactPage v-else-if="currentPage === 'contact'" />
    <LoginPage v-else-if="currentPage === 'login'" @navigate="navigate" />
    <ApiDocsPage v-else-if="currentPage === 'api'" />
    <AdminDashboard v-else-if="currentPage === 'admin' && currentUser?.role === 'Admin'" />
    <section v-else-if="currentPage === 'admin'" class="container my-5">
      <h1 class="h3">Admin Dashboard</h1>
      <div class="alert alert-warning" role="alert">This page is only available to administrators.</div>
    </section>
  </main>

  <footer class="bg-white border-top py-4 mt-5">
    <div class="container text-center text-muted small">
      &copy; 2026 GreenMinds Australia. All rights reserved.
      <span aria-hidden="true">·</span>
      <a href="#" class="link-secondary" @click.prevent="navigate('api')">Developer API</a>
    </div>
  </footer>
</template>
