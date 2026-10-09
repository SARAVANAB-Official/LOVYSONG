import { expect, test } from '@playwright/test'
import { requireBackend, topTracksSection } from './helpers'

test.beforeAll(requireBackend)

test('liking a track saves it to Liked Songs', async ({ page }) => {
  await page.goto('/')

  const section = topTracksSection(page)
  const rows = section.locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })

  const title = (await rows.first().locator('div.truncate').first().innerText()).trim()
  const row = rows.first()
  await row.hover()
  await row.getByRole('button', { name: 'Save to Liked Songs' }).click()

  // The heart switches to the liked state.
  await expect(row.getByRole('button', { name: 'Remove from Liked Songs' })).toBeVisible()

  // Navigate via the home quick card.
  await page.goto('/')
  await page.getByRole('link', { name: /Liked Songs/ }).first().click()
  await expect(page).toHaveURL(/\/liked/)
  await expect(page.getByRole('heading', { name: 'Liked songs' })).toBeVisible()
  await expect(page.getByText(/1 song you've liked/)).toBeVisible()
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible()

  // Liking is persisted across a reload.
  await page.reload()
  await expect(page.getByText(/1 song you've liked/)).toBeVisible()
})

test('create a playlist and add a track to it', async ({ page }) => {
  await page.goto('/playlists')
  await expect(page.getByRole('heading', { name: 'Playlists', exact: true })).toBeVisible()

  // Create the playlist (fresh context = no playlists yet; header + empty-state buttons both qualify).
  await page.getByRole('button', { name: /Create your first playlist|New playlist/ }).first().click()
  await page.getByPlaceholder('Playlist name').fill('Road Trip')
  await page.getByRole('button', { name: 'Create', exact: true }).click()

  await expect(page).toHaveURL(/\/playlists\/[^/]+$/)
  await expect(page.getByRole('heading', { name: 'Road Trip' })).toBeVisible()
  await expect(page.getByText(/0 tracks · saved in this browser/)).toBeVisible()

  // Add a track from the home page row menu.
  await page.goto('/')
  const section = topTracksSection(page)
  const rows = section.locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  const title = (await rows.first().locator('div.truncate').first().innerText()).trim()

  const row = rows.first()
  await row.hover()
  await row.getByRole('button', { name: 'More options' }).click()
  await page.getByRole('button', { name: 'Add to playlist', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Add to playlist' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(title, { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: /Road Trip/ }).click()
  await expect(dialog).toBeHidden()

  // Verify the playlist now holds the track.
  await page.goto('/playlists')
  // Sidebar and grid both link to it — either is fine.
  await page.getByRole('link', { name: /Road Trip/ }).first().click()
  await expect(page).toHaveURL(/\/playlists\/[^/]+$/)
  await expect(page.getByText(/1 track · saved in this browser/)).toBeVisible()
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible()
})

test('recently played records the track that was started', async ({ page }) => {
  test.slow()

  await page.goto('/')
  const section = topTracksSection(page)
  const rows = section.locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })
  const title = (await rows.first().locator('div.truncate').first().innerText()).trim()

  await rows.first().locator('button').first().click()
  await expect(page.locator('footer').getByText(title, { exact: false }).first()).toBeVisible({
    timeout: 20_000,
  })

  await page.goto('/recent')
  await expect(page.getByRole('heading', { name: 'Recently played' })).toBeVisible()
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 20_000 })
})
