import { expect, test } from '@playwright/test'

import { expectAuthedShell, login } from './visual/harness'

test('demo login lands on the authed dashboard shell', async ({ page }) => {
  await login(page)

  // The app shell renders its sidebar nav once authenticated.
  await expectAuthedShell(page)
  // The dashboard greets the operator (Bahasa Indonesia heading).
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
