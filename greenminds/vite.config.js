import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // In local development the Cloudflare Pages Functions (BR E.1) run
    // under `npm run dev:api` on port 8788; forward /api calls there.
    proxy: {
      '/api': 'http://localhost:8788'
    }
  }
})
