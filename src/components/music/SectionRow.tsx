import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SectionRowProps {
  title: string
  subtitle?: string
  seeAllHref?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Horizontally scrolling content row with a section header. */
export function SectionRow({ title, subtitle, seeAllHref, action, children, className }: SectionRowProps) {
  return (
    <section className={cn('animate-fade-up', className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-white/45">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {seeAllHref ? (
            <Link
              to={seeAllHref}
              className="flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/45 transition hover:text-white"
            >
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 no-scrollbar">
        {children}
      </div>
    </section>
  )
}

/** Wrapper that gives each child a fixed responsive width inside a SectionRow. */
export function SectionItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-[150px] shrink-0 snap-start sm:w-[168px] lg:w-[184px]', className)}>{children}</div>
  )
}
