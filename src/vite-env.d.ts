/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VEROME_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT_MS?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export {}
