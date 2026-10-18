import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import App from './App.vue'
import './assets/main.css'

// PrimeVue powers the interactive tables (BR D.3). The Aura preset is
// recoloured with the GreenMinds green so it sits alongside Bootstrap.
const GreenMindsPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f7ec',
      100: '#e0edd2',
      200: '#c2dba6',
      300: '#9dc372',
      400: '#78a845',
      500: '#5a8a24',
      600: '#3b6d11',
      700: '#27500a',
      800: '#1f4008',
      900: '#183206',
      950: '#0d1d03'
    }
  }
})

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: GreenMindsPreset,
      options: { darkModeSelector: false }
    }
  })
  .mount('#app')
