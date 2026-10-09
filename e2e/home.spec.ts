import { expect, test } from '@playwright/test'
import { requireBackend, topTracksSection } from './helpers'

test.beforeAll(requireBackend)

test('home renders with a live API connection and real content', async ({ page }) => {
  await page.goto('/')

  // Greeting heading + subtitle.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText(/powered by the Verome API/)).toBeVisible()

  // TopBar health badge proves the frontend can reach the backend.
  await expect(page.getByText('Connected', { exact: true })).toBeVisible({ timeout: 20_000 })

  // Static quick-access links.
  await expect(page.getByRole('link', { name: /Liked Songs/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Your Playlists/ }).first()).toBeVisible()

  // Real API content: the Top tracks list resolves past its skeleton state.
  await expect(topTracksSection(page).getByRole('heading', { name: 'Top tracks' })).toBeVisible()
  const rows = topTracksSection(page).locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  expect((await rows.first().innerText()).trim().length).toBeGreaterThan(0)
})

test('unknown routes show the 404 page and can navigate home', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')

  await expect(page.getByText('404', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()

  await page.getByRole('link', { name: /Go home/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
