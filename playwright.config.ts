import { defineConfig } from '@playwright/test'

// A dedicated port: 5173 is often occupied by other Vite apps on this machine.
const PORT = Number(process.env.PORT ?? 5273)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    // Use the Chrome already installed on the machine — no browser download needed.
    channel: 'chrome',
    trace: 'retain-on-failure',
    launchOptions: {
      // Allow the engine to start playback without a prior user gesture and
      // keep the run silent on CI machines.
      args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
    },
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
