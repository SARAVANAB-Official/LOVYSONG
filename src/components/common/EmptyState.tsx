import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-ink-850/50 px-6 py-14 text-center', className)}>
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-brand-400">{icon}</div>
      ) : null}
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-white/45">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
