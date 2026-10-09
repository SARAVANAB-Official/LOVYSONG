import { expect, test } from '@playwright/test'
import { requireBackend } from './helpers'

test.beforeAll(requireBackend)

test('searching from the top bar returns real results', async ({ page }) => {
  await page.goto('/')

  // Desktop top bar search input (aria-label "Search music").
  const topBarInput = page.locator('header').getByLabel('Search music')
  await topBarInput.fill('Coldplay')
  await topBarInput.press('Enter')

  await expect(page).toHaveURL(/\/search\?q=Coldplay/)

  // The search page owns its own input, seeded from the URL.
  const pageInput = page.locator('main').getByLabel('Search music')
  await expect(pageInput).toHaveValue('Coldplay')

  // Filter tabs are present.
  await expect(page.getByRole('button', { name: 'Songs', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Artists', exact: true })).toBeVisible()

  // Real results resolve into the Songs section with playable rows
  // (the All tab fans out to songs/artists/albums/playlists requests).
  await expect(page.getByRole('heading', { name: 'Songs', exact: true })).toBeVisible({ timeout: 45_000 })
  const rows = page.locator('main div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  // The artist group resolves too.
  await expect(page.getByRole('heading', { name: 'Artists', exact: true })).toBeVisible({ timeout: 45_000 })
})

test('search filter tabs switch result views', async ({ page }) => {
  await page.goto('/search?q=Coldplay')

  // Dismiss the focused input's suggestion dropdown so it can't intercept clicks.
  await page.locator('main').getByLabel('Search music').press('Escape')

  await page.getByRole('button', { name: 'Artists', exact: true }).click()
  await expect(page).toHaveURL(/filter=artists/)
  await expect(page.locator('a[href^="/artist/"]').first()).toBeVisible({ timeout: 30_000 })
})

test('search history records and re-opens previous queries', async ({ page }) => {
  await page.goto('/search')
  const input = page.locator('main').getByLabel('Search music')
  await input.fill('Jazz classics')
  await input.press('Enter')
  await expect(page).toHaveURL(/q=Jazz(%20|\+)classics/)

  // Re-focus an empty search box: recent history is offered in the dropdown.
  await page.goto('/search')
  const freshInput = page.locator('main').getByLabel('Search music')
  await freshInput.click()
  await expect(page.getByText('Recent', { exact: true })).toBeVisible()
  // The history entry carries a nested "Remove …" control (unlike suggestion chips).
  await expect(page.getByRole('button', { name: /^Jazz classics Remove/ })).toBeVisible()
})
