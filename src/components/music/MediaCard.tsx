import { Link } from 'react-router-dom'
import { Cover } from '@/components/common/Cover'
import { PlayFab } from '@/components/music/PlayFab'
import { cn } from '@/utils/cn'

export type MediaCardVariant = 'album' | 'artist' | 'playlist' | 'mood' | 'generic'

interface MediaCardProps {
  title: string
  subtitle?: string | null
  image?: string | null
  href?: string
  variant?: MediaCardVariant
  onPlay?: (e: React.MouseEvent) => void
  playing?: boolean
  badge?: string
  className?: string
}

const GRADIENTS = [
  'from-emerald-500/70 to-teal-800/80',
  'from-violet-500/60 to-indigo-900/80',
  'from-rose-500/60 to-fuchsia-900/80',
  'from-amber-500/60 to-orange-900/80',
  'from-sky-500/60 to-blue-900/80',
  'from-lime-500/60 to-green-900/80',
]

function gradientFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

export function MediaCard({
  title,
  subtitle,
  image,
  href,
  variant = 'generic',
  onPlay,
  playing,
  badge,
  className,
}: MediaCardProps) {
  const round = variant === 'artist'
  const isMood = variant === 'mood'

  const inner = (
    <div className={cn('group/card relative', className)}>
      <div className="relative">
        {isMood && !image ? (
          <div className={cn('aspect-square w-full rounded-xl bg-gradient-to-br', gradientFor(title))} />
        ) : (
          <Cover
            src={image}
            alt={title}
            rounded={round ? 'rounded-full' : 'rounded-xl'}
            className={cn('aspect-square w-full', !round && 'shadow-card')}
          />
        )}
        {onPlay ? (
          <div className="pointer-events-none absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <div className="pointer-events-auto">
              <PlayFab playing={playing} onClick={onPlay} size="md" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-3 min-w-0">
        <div className={cn('flex items-center gap-2', round && 'justify-center text-center')}>
          <h3 className="truncate text-sm font-semibold text-white/92">{title}</h3>
          {badge ? (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className={cn('mt-0.5 truncate text-xs text-white/45', round && 'text-center')}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="block focus-visible:outline-none">
        {inner}
      </Link>
    )
  }
  return inner
}
