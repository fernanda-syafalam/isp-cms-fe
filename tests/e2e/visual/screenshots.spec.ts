import { test } from '@playwright/test'

import { PAGES, THEMES, VIEWPORTS, applyTheme, capture, login } from './harness'

/**
 * Visual evidence capture — NOT a pass/fail assertion. For each theme it logs in
 * once, then walks every page at each breakpoint and writes a full-page PNG to
 * tests/e2e/visual/__shots__/. Review the gallery as per-PR redesign evidence.
 *
 * Run with `pnpm shots` (the `visual` Playwright project). The default e2e run
 * (`pnpm test:e2e`) ignores this folder so critical-path tests stay fast.
 */
for (const theme of THEMES) {
  test(`capture screenshots — ${theme}`, async ({ page }) => {
    await applyTheme(page, theme)
    await login(page)

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      for (const p of PAGES) {
        await page.goto(p.path)
        await capture(page, `${p.name}__${vp.name}__${theme}`)
      }
    }
  })
}
