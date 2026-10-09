import { Link } from 'react-router-dom'
import { Cover } from '@/components/common/Cover'
import { EqualizerBars } from '@/components/common/EqualizerBars'
import { PlayFab } from '@/components/music/PlayFab'
import { cn } from '@/utils/cn'
import type { Track } from '@/types/music'

interface TrackCardProps {
  track: Track
  onPlay: (e: React.MouseEvent) => void
  playing?: boolean
  active?: boolean
  className?: string
}

/** Square artwork card used in horizontal carousels. Clicking plays the track. */
export function TrackCard({ track, onPlay, playing, active, className }: TrackCardProps) {
  return (
    <div className={cn('group relative', className)}>
      <div className="relative">
        <button type="button" onClick={onPlay} aria-label={`Play ${track.title}`} className="block w-full">
          <Cover
            src={track.thumbnail}
            alt={track.title}
            className={cn('aspect-square w-full shadow-card transition-transform duration-300 group-hover:scale-[1.02]', active && 'ring-2 ring-brand-500/70')}
            rounded="rounded-xl"
          />
        </button>
        <div className="pointer-events-none absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="pointer-events-auto">
            <PlayFab playing={playing} onClick={onPlay} />
          </div>
        </div>
        {active ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink-950/85 px-2 py-1">
            <EqualizerBars playing={playing} className="h-3 w-3" />
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="truncate text-sm font-semibold text-white/90">{track.title}</div>
        <div className="truncate text-xs text-white/45">
          {track.artistId ? (
            <Link to={`/artist/${track.artistId}`} className="transition hover:text-white/80 hover:underline" onClick={(e) => e.stopPropagation()}>
              {track.artist || 'Unknown artist'}
            </Link>
          ) : (
            track.artist || 'Unknown artist'
          )}
        </div>
      </div>
    </div>
  )
}
