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
  'src/features/resellers/lib/**/*.test.ts',
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
    rollupOptions: {
      output: {
        // Split STABLE, EAGERLY-loaded vendor libraries out of the app entry
        // chunk so (a) the entry shrinks and gets budget headroom and (b) the
        // vendor code caches independently of app deploys (its hash only
        // changes on a dependency bump, not on every app change).
        //
        // Only match libraries that are part of the eager app shell. We must
        // NOT fight TanStack Router's per-route lazy splitting: heavy, lazily
        // reached deps (recharts, leaflet, qrcode.react) already live in their
        // own on-demand chunks — they are intentionally absent from this map so
        // Rollup keeps them lazy. `react-table` is likewise left to Rollup: it
        // is only reached from lazy route chunks, so forcing it eager here
        // would regress the critical path.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // react / react-dom / scheduler / react/jsx-runtime — the runtime.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          // TanStack Router + Query power the eager app shell (router + query
          // provider mount in main.tsx). react-table is deliberately excluded.
          if (
            id.includes('node_modules/@tanstack/react-router') ||
            id.includes('node_modules/@tanstack/react-query') ||
            id.includes('node_modules/@tanstack/query-core') ||
            id.includes('node_modules/@tanstack/router-core') ||
            id.includes('node_modules/@tanstack/history') ||
            id.includes('node_modules/@tanstack/store')
          ) {
            return 'vendor-tanstack'
          }
          // Radix primitives used across the eager shell (dialogs, dropdowns…).
          if (id.includes('node_modules/radix-ui/') || id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix'
          }
          // Form + validation stack (react-hook-form + resolvers + zod) is used
          // by the eager shell and most routes.
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod/')
          ) {
            return 'vendor-forms'
          }
          return undefined
        },
      },
    },
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
