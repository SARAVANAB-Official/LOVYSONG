import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Cover } from '@/components/common/Cover'
import { EqualizerBars } from '@/components/common/EqualizerBars'
import { TrackMenu } from '@/components/music/TrackMenu'
import { useLibraryStore } from '@/stores/libraryStore'
import { cn } from '@/utils/cn'
import type { Track } from '@/types/music'

interface TrackRowProps {
  track: Track
  index: number
  active: boolean
  playing: boolean
  onPlay: (index: number) => void
  onRemove?: (index: number) => void
  showArtwork?: boolean
  showAlbum?: boolean
  showIndex?: boolean
  className?: string
}

export function TrackRow({
  track,
  index,
  active,
  playing,
  onPlay,
  showArtwork = true,
  showAlbum = false,
  showIndex = true,
  className,
}: TrackRowProps) {
  const isLiked = useLibraryStore((s) => s.isLiked(track.id))
  const toggleLike = useLibraryStore((s) => s.toggleLike)

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => onPlay(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPlay(index)
      }}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.05] sm:px-3',
        active && 'bg-white/[0.06]',
        className,
      )}
    >
      {showIndex ? (
        <button
          type="button"
          onClick={() => onPlay(index)}
          aria-label={`Play ${track.title}`}
          className="flex w-6 shrink-0 items-center justify-center text-sm text-white/40"
        >
          {active ? (
            <EqualizerBars playing={playing} className="h-3.5 w-4" />
          ) : (
            <>
              <span className="tabular-nums group-hover:hidden">{index + 1}</span>
              <svg viewBox="0 0 24 24" className="hidden h-4 w-4 fill-white group-hover:block" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </>
          )}
        </button>
      ) : null}

      {showArtwork ? (
        <button type="button" onClick={() => onPlay(index)} aria-label={`Play ${track.title}`} className="shrink-0">
          <Cover src={track.thumbnail} alt={track.title} className="h-11 w-11" rounded="rounded-md" />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-sm font-medium', active ? 'text-brand-400' : 'text-white/90')}>
          {track.title}
        </div>
        <div className="truncate text-xs text-white/45">
          {track.artistId ? (
            <Link
              to={`/artist/${track.artistId}`}
              className="transition-colors hover:text-white/80 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist || 'Unknown artist'}
            </Link>
          ) : (
            track.artist || 'Unknown artist'
          )}
          {showAlbum && track.album ? <span className="hidden md:inline"> · {track.album}</span> : null}
        </div>
      </div>

      <button
        type="button"
        aria-label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        onClick={(e) => {
          e.stopPropagation()
          toggleLike(track)
        }}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:text-white',
          isLiked ? 'text-brand-400' : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
        )}
      >
        <Heart className={cn('h-4 w-4', isLiked && 'fill-brand-400')} />
      </button>

      <div className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-white/40 sm:block">
        {track.durationText || ''}
      </div>

      <TrackMenu track={track} />
    </div>
  )
}
