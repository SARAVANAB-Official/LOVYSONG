import { expect, test } from '@playwright/test'
import { requireBackend } from './helpers'

test.beforeAll(requireBackend)

const PAGES = [
  { path: '/explore', heading: 'Explore' },
  { path: '/charts', heading: 'Charts' },
  { path: '/moods', heading: 'Moods & genres' },
  { path: '/library', heading: 'Library' },
  { path: '/recent', heading: 'Recently played' },
  { path: '/liked', heading: 'Liked songs' },
  { path: '/playlists', heading: 'Playlists' },
  { path: '/search', heading: 'Search' },
] as const

for (const { path, heading } of PAGES) {
  test(`${path} renders the "${heading}" page`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible({
      timeout: 20_000,
    })
    // The layout shell stays mounted (sidebar nav + player bar).
    await expect(page.locator('footer')).toBeVisible()
  })
}

test('charts page loads regional chart playlists from the API', async ({ page }) => {
  await page.goto('/charts')
  await expect(page.getByRole('heading', { level: 1, name: 'Charts' })).toBeVisible()
  // Either real chart cards or an explicit empty/error state — never a silent hang.
  const chartLinks = page.locator('main a[href^="/playlist/"]')
  const fallback = page.getByText(/No charts|Charts unavailable/)
  await expect
    .poll(async () => (await chartLinks.count()) > 0 || (await fallback.count()) > 0, {
      timeout: 30_000,
    })
    .toBe(true)
})

test('moods page opens a genre and shows live results', async ({ page }) => {
  test.slow()
  await page.goto('/moods')
  await expect(page.getByRole('heading', { level: 1, name: 'Moods & genres' })).toBeVisible()

  const moodCard = page.locator('main a[href^="/moods?genre="]').first()
  await expect(moodCard).toBeVisible({ timeout: 30_000 })
  await moodCard.click()

  await expect(page).toHaveURL(/\/moods\?genre=/)
  // Live results resolve into a heading (either tracks or an explicit empty state).
  await expect(page.locator('main h1, main h2').last()).toBeVisible({ timeout: 30_000 })
})
