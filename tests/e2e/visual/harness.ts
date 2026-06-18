import { type Page, expect } from '@playwright/test'

/**
 * The breakpoints the dashboard must look right at (see CLAUDE.md › Performance
 * and the redesign spec). Mobile is the load-bearing one for the topology view.
 */
export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

export const THEMES = ['light', 'dark'] as const

export type Viewport = (typeof VIEWPORTS)[number]
export type Theme = (typeof THEMES)[number]

/**
 * Pages captured as visual evidence. `name` becomes the screenshot filename slug
 * (kebab-case). Extend this list as the redesign sweep reaches each nav-group so
 * every PR can show before/after across the matrix.
 */
export const PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'customers', path: '/customers' },
  { name: 'invoices', path: '/invoices' },
  { name: 'tickets', path: '/tickets' },
  { name: 'work-orders', path: '/work-orders' },
  { name: 'topology', path: '/network/topology' },
  { name: 'routers', path: '/network/routers' },
  { name: 'reports', path: '/reports' },
  { name: 'settings', path: '/settings' },
] as const

/** Where the capture run writes its PNG gallery (gitignored). */
export const SHOTS_DIR = 'tests/e2e/visual/__shots__'

/**
 * Force a theme before the app boots. next-themes reads the `theme` key from
 * localStorage on first paint, so seeding it via an init script avoids a reload
 * (which would otherwise drop the in-memory access token) and prevents flicker.
 */
export async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('theme', value)
  }, theme)
}

/**
 * Demo auth: any email + password of at least 8 characters logs in as admin
 * (see src/routes/login.lazy.tsx and the MSW auth handler), so the full nav is
 * visible. Call after applyTheme so the first navigation already has the theme.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@ashnet.id')
  await page.getByLabel('Kata sandi').fill('password123')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

/**
 * Navigate and let the page settle, then write a full-page PNG. Network idle is
 * best-effort: map tiles can keep the connection busy, so we cap the wait and
 * fall through to a short render settle rather than failing the capture.
 */
export async function capture(page: Page, fileName: string): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  // Let async content (charts, map, skeleton→data swap) paint before the shot.
  await page.waitForTimeout(600)
  await page.screenshot({
    path: `${SHOTS_DIR}/${fileName}.png`,
    fullPage: true,
  })
}

/** Sanity check used by the smoke test: the authed shell renders its sidebar. */
export async function expectAuthedShell(page: Page): Promise<void> {
  await expect(page.getByRole('navigation').first()).toBeVisible()
}
