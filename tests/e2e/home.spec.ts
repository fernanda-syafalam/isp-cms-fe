import { expect, test } from '@playwright/test'

test('home page renders', async ({ page }) => {
  await page.goto('/')
  // The dashboard home greets the operator; unauthenticated it still shows
  // the "Welcome" heading from the public layout.
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
})
