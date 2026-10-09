import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * App-wide providers: TanStack Query with sane retry/stale defaults.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 15 * 60_000,
            retry: (failureCount, error) => {
              // Never retry 4xx — they're deterministic.
              const status = (error as { status?: number })?.status
              if (typeof status === 'number' && status >= 400 && status < 500) return false
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
