import { logger } from '@/utils/logger'

export type ApiErrorCode =
  | 'timeout'
  | 'network'
  | 'not_found'
  | 'rate_limited'
  | 'client_error'
  | 'server_error'
  | 'invalid_response'
  | 'cancelled'
  | 'unknown'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number
  readonly url: string
  readonly retryable: boolean

  constructor(message: string, opts: { code: ApiErrorCode; url: string; status?: number; retryable?: boolean }) {
    super(message)
    this.name = 'ApiError'
    this.code = opts.code
    this.url = opts.url
    this.status = opts.status
    this.retryable = opts.retryable ?? false
  }

  /** Friendly, user-facing text. */
  get userMessage(): string {
    switch (this.code) {
      case 'timeout':
        return 'The request took too long. Please try again.'
      case 'network':
        return 'Could not reach the music service. Check your connection.'
      case 'not_found':
        return 'We could not find that.'
      case 'rate_limited':
        return 'The service is busy right now. Please wait a moment.'
      case 'server_error':
        return 'The music service had a problem. Please try again shortly.'
      case 'invalid_response':
        return 'Received an unexpected response from the music service.'
      case 'cancelled':
        return 'Request was cancelled.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
}

export const DEFAULT_TIMEOUT_MS = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS ?? '', 10) || 15_000

export function baseUrl(): string {
  const raw = import.meta.env.VITE_VEROME_API_BASE_URL ?? 'http://localhost:8000'
  return raw.replace(/\/+$/, '')
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
  timeoutMs?: number
  retries?: number
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

function combineSignals(timeoutMs: number, caller?: AbortSignal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs)
  const onCallerAbort = () => controller.abort(caller?.reason ?? new DOMException('aborted', 'AbortError'))
  if (caller) {
    if (caller.aborted) onCallerAbort()
    else caller.addEventListener('abort', onCallerAbort, { once: true })
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer)
      caller?.removeEventListener('abort', onCallerAbort)
    },
  }
}

/** In-flight de-duplication so identical concurrent GETs share one request. */
const inFlight = new Map<string, Promise<unknown>>()

async function requestOnce(url: string, timeoutMs: number, caller?: AbortSignal): Promise<unknown> {
  const { signal, cleanup } = combineSignals(timeoutMs, caller)
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      mode: 'cors',
    })

    if (!response.ok) {
      const status = response.status
      const code: ApiErrorCode =
        status === 404 ? 'not_found' : status === 429 ? 'rate_limited' : status >= 500 ? 'server_error' : 'client_error'
      throw new ApiError(`Request failed with status ${status}`, {
        code,
        url,
        status,
        retryable: code === 'server_error' || code === 'rate_limited',
      })
    }

    let data: unknown
    try {
      data = await response.json()
    } catch {
      throw new ApiError('Response was not valid JSON', { code: 'invalid_response', url, status: response.status })
    }
    if (data === null || typeof data !== 'object') {
      throw new ApiError('Response was not a JSON object', { code: 'invalid_response', url, status: response.status })
    }
    return data
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (signal.aborted) {
      const reason = signal.reason as { name?: string } | undefined
      if (reason?.name === 'TimeoutError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, { code: 'timeout', url, retryable: true })
      }
      const cancelled = new ApiError('Request was cancelled', { code: 'cancelled', url })
      throw cancelled
    }
    throw new ApiError(err instanceof Error ? err.message : String(err), { code: 'network', url, retryable: true })
  } finally {
    cleanup()
  }
}

function backoff(attempt: number): number {
  const base = 400 * Math.pow(2, attempt)
  return Math.min(base + Math.random() * 250, 4_000)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Perform a GET against the Verome API with:
 * timeouts, bounded exponential-backoff retries, in-flight deduplication,
 * cancellation, and normalized errors.
 */
export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.params)
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options.retries ?? 2

  const shared = (async (): Promise<unknown> => {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestOnce(url, timeoutMs, options.signal)
      } catch (err) {
        lastError = err
        const cancelled = err instanceof ApiError && err.code === 'cancelled'
        if (cancelled) throw err
        const retryable = err instanceof ApiError && err.retryable
        if (!retryable || attempt === maxRetries) throw err
        logger.debug('api', `retry ${attempt + 1}/${maxRetries} for ${url}`)
        await sleep(backoff(attempt))
      }
    }
    throw lastError
  })()

  inFlight.set(url, shared)
  try {
    return (await shared) as T
  } finally {
    if (inFlight.get(url) === shared) inFlight.delete(url)
  }
}

/** Returns true when the backend is reachable. Used for the health badge. */
export async function probeHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await apiGet<{ status?: string }>('/health', { timeoutMs: 8_000, retries: 0, signal })
    return res?.status === 'ok'
  } catch {
    return false
  }
}

/** Normalize any thrown value into an ApiError for consistent UI handling. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new ApiError('Request was cancelled', { code: 'cancelled', url: '' })
  }
  return new ApiError(err instanceof Error ? err.message : String(err), { code: 'unknown', url: '' })
}
