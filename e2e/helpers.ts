import { expect } from '@playwright/test'

/** The Verome API the frontend is pointed at (matches .env locally). */
export const API_BASE = process.env.VITE_VEROME_API_BASE_URL ?? 'http://localhost:8000'

/**
 * Fail fast, with a useful message, when the Verome backend is not running.
 * Every e2e suite depends on real API data — there are no fixtures.
 */
export async function requireBackend(): Promise<void> {
  let response: Response | null = null
  try {
    response = await fetch(`${API_BASE}/health`)
  } catch (err) {
    throw new Error(
      `Verome API at ${API_BASE} is unreachable (${String(err)}). ` +
        'Start the Deno backend before running e2e tests.',
    )
  }
  expect(response.ok, `Verome API /health returned ${response.status} (${API_BASE})`).toBe(true)
  const body = (await response.json()) as { status?: string }
  expect(body.status).toBe('ok')
}

/** Scoped "Top tracks" section on the home page (used by several suites). */
export function topTracksSection(page: import('@playwright/test').Page) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Top tracks' }) })
    .first()
}
