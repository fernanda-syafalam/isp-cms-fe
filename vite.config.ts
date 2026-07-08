/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'node:path'

// Pure-logic test files: no HTTP calls, no DOM. They run in the `node` project
// with no setup (no jsdom, no MSW server, no per-test seed clone). Everything
// else runs in the `app` project (jsdom + MSW). Verified: none of these import
// @/api, ky, msw, react, or @testing-library, and none reference window/document.
const PURE_TEST_GLOBS = [
  'src/schemas/**/*.test.ts',
  'src/features/topology/lib/**/*.test.ts',
  'src/lib/errors.test.ts',
  'src/lib/invoice.test.ts',
  'src/lib/permissions.test.ts',
  'src/lib/safeRedirect.test.ts',
  'src/lib/sla.test.ts',
]

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
    globals: true,
    css: false,
    env: {
      // Deterministic absolute URL for tests so jsdom can resolve relative
      // paths inside ky / fetch. Production fallback in api/client.ts stays
      // relative ('/api') because the SPA is served from the same origin.
      VITE_API_BASE_URL: 'http://test.local/api',
    },
    // Stability tuning (flakiness root cause, audit A5-H2). Defaults let a
    // loaded machine oversubscribe CPU re-evaluating the 5.8k-line MSW mock in
    // every worker, and with no timeouts a slow collect/setup step timed out —
    // surfacing as the portal/topology "flakes". Forks isolate that work and a
    // capped worker pool + generous timeouts keep it stable under load.
    pool: 'forks',
    maxWorkers: '50%',
    minWorkers: 1,
    testTimeout: 15_000,
    hookTimeout: 20_000,
    // Two projects so pure-logic tests never import/start MSW (nor jsdom):
    //  - `node`: schemas, pure lib, and topology/lib math. No setup at all.
    //  - `app` : everything else — jsdom + jest-dom polyfills + MSW server.
    // Keep PURE_TEST_GLOBS in sync: a file listed here MUST make no HTTP call
    // and touch no DOM (it runs in `node` with no MSW server + resetMockDb).
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: PURE_TEST_GLOBS,
        },
      },
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.base.ts', './src/test/setup.ts'],
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          exclude: [...PURE_TEST_GLOBS, '**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
        },
      },
    ],
  },
})
