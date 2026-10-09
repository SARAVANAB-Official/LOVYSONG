import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// Node 22+ ships a `localStorage` global that throws unless the process was
// started with `--localstorage-file`, and jsdom's copy is not always installed
// on `globalThis`. Zustand's persist middleware resolves the bare `localStorage`
// identifier, so install a self-contained test double before any store loads.
try {
  let memory: Record<string, string> = {}
  const storageShim = {
    getItem: (key: string) => (key in memory ? memory[key] : null),
    setItem: (key: string, value: string) => {
      memory[key] = String(value)
    },
    removeItem: (key: string) => {
      delete memory[key]
    },
    clear: () => {
      memory = {}
    },
    key: (index: number) => Object.keys(memory)[index] ?? null,
    get length() {
      return Object.keys(memory).length
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storageShim })
} catch {
  // Non-fatal: tests that don't touch storage still run.
}

// jsdom lacks these media APIs used by the playback engine and cover art handling.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!globalThis.HTMLMediaElement.prototype.play) {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: () => Promise.resolve(),
  })
}
if (!globalThis.HTMLMediaElement.prototype.pause) {
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: () => {},
  })
}
