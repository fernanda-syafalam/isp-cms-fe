import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Critical-path E2E (login + primary actions). Stays fast — the visual
      // capture suite lives in its own project below.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/visual/**',
    },
    {
      // Screenshot evidence gallery — run via `pnpm shots`. Each test drives
      // many pages × viewports, so it gets a generous timeout and no retries.
      name: 'visual',
      testMatch: '**/visual/**/*.spec.ts',
      retries: 0,
      timeout: 180_000,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
