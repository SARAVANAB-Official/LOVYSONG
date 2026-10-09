import { expect, test } from '@playwright/test'
import { requireBackend, topTracksSection } from './helpers'

test.beforeAll(requireBackend)

test('clicking a track starts real playback that advances in time', async ({ page }) => {
  test.slow() // stream resolution + YouTube engine bootstrap can take a while

  await page.goto('/')

  const section = topTracksSection(page)
  const rows = section.locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })

  const title = (await rows.first().locator('div.truncate').first().innerText()).trim()
  expect(title.length).toBeGreaterThan(0)

  // Play the row (first button in a TrackRow is the index/play control).
  await rows.first().locator('button').first().click()

  const footer = page.locator('footer')

  // 1. The player bar picks up the track.
  await expect(footer.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 20_000 })

  // 2. The engine reaches a playing state — play/pause control flips to "Pause".
  await expect(footer.getByRole('button', { name: 'Pause' }).first()).toBeEnabled({ timeout: 45_000 })

  // 3. No playback error banner.
  await expect(page.getByRole('button', { name: 'Dismiss playback error' })).toHaveCount(0)

  // 4. A real engine is attached: the YouTube IFrame player.
  //    (Direct /api/stream is 404 on the current backend, so this is the active path.
  //    YT.Player replaces its container div with an iframe carrying the same id.)
  await expect(page.locator('#sonicwave-yt-engine')).toBeAttached({ timeout: 30_000 })

  // 5. Playback time actually advances (first tabular time label = current time).
  const timeLabel = footer.locator('span.tabular-nums').first()
  await expect
    .poll(async () => (await timeLabel.innerText()).trim(), { timeout: 60_000 })
    .not.toBe('0:00')

  // 6. Pause and resume work.
  await footer.getByRole('button', { name: 'Pause' }).first().click()
  await expect(footer.getByRole('button', { name: 'Play', exact: true }).first()).toBeEnabled()

  await footer.getByRole('button', { name: 'Play', exact: true }).first().click()
  await expect(footer.getByRole('button', { name: 'Pause' }).first()).toBeEnabled({ timeout: 20_000 })
})

test('queue controls respond while a track is loaded', async ({ page }) => {
  test.slow()

  await page.goto('/')
  const section = topTracksSection(page)
  const rows = section.locator('div[role="button"][tabindex="0"]')
  await expect(rows.first()).toBeVisible({ timeout: 30_000 })

  const firstTitle = (await rows.first().locator('div.truncate').first().innerText()).trim()
  await rows.first().locator('button').first().click()

  const footer = page.locator('footer')
  await expect(footer.getByText(firstTitle, { exact: false }).first()).toBeVisible({ timeout: 20_000 })

  // Next track swaps the player bar to a different title.
  await footer.getByRole('button', { name: 'Next track' }).first().click()
  await expect
    .poll(async () => (await footer.innerText()).includes(firstTitle), { timeout: 30_000 })
    .toBe(false)

  // Queue panel opens from the top bar (RightPanel only mounts when open).
  await page.getByRole('button', { name: 'Toggle queue' }).first().click()
  await expect(page.getByRole('button', { name: 'Close panel' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('Queue', { exact: true }).last()).toBeVisible()
})
