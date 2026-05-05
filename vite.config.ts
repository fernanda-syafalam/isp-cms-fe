/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Critical bundle is ~600 kB (~187 kB gzip) for an admin SPA, which is
    // acceptable. Bumped above Vite's 500 kB default so the warning doesn't
    // mask real regressions; revisit with a real bundle-size budget in CI.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    env: {
      // Deterministic absolute URL for tests so jsdom can resolve relative
      // paths inside ky / fetch. Production fallback in api/client.ts stays
      // relative ('/api') because the SPA is served from the same origin.
      VITE_API_BASE_URL: 'http://test.local/api',
    },
  },
})
