import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query and returns its current value.
 * Implemented with `useSyncExternalStore` so the store is the browser's own
 * MediaQueryList — no setState-in-effect cascades.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
