import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6 lg:px-10', className)}>{children}</div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</div> : null}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-white/50">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}
