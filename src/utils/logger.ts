/**
 * Development-only diagnostic logging.
 * We intentionally do NOT disable console output globally and never swallow
 * errors — production builds simply reduce verbosity.
 */

const enabled = import.meta.env.DEV

type Level = 'debug' | 'info' | 'warn' | 'error'

function emit(level: Level, scope: string, ...args: unknown[]) {
  if (level === 'debug' && !enabled) return
  const prefix = `[sonicwave:${scope}]`
  // eslint-disable-next-line no-console
  console[level](prefix, ...args)
}

export const logger = {
  debug: (scope: string, ...args: unknown[]) => emit('debug', scope, ...args),
  info: (scope: string, ...args: unknown[]) => emit('info', scope, ...args),
  warn: (scope: string, ...args: unknown[]) => emit('warn', scope, ...args),
  error: (scope: string, ...args: unknown[]) => emit('error', scope, ...args),
}
