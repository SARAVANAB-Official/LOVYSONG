import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.04] px-6 py-12 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
      {message ? <p className="mt-1.5 max-w-md text-sm text-white/50">{message}</p> : null}
      {onRetry ? (
        <button onClick={onRetry} className="btn-ghost mt-5">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      ) : null}
    </div>
  )
}
