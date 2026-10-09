import { Link } from 'react-router-dom'
import { Heart, ListMusic, Mic2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, X } from 'lucide-react'
import { Cover } from '@/components/common/Cover'
import { ProgressBar } from '@/components/player/ProgressBar'
import { VolumeControl } from '@/components/player/VolumeControl'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

export function PlayerBar() {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const engineState = usePlayerStore((s) => s.engineState)
  const duration = usePlayerStore((s) => s.duration)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const error = usePlayerStore((s) => s.error)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)
  const dismissError = usePlayerStore((s) => s.dismissError)

  const isLiked = useLibraryStore((s) => (current ? s.isLiked(current.id) : false))
  const toggleLike = useLibraryStore((s) => s.toggleLike)

  const ui = useUiStore()
  const busy = engineState === 'resolving' || engineState === 'loading'
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  if (!current) {
    return (
      <footer className="z-40 border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="h-12 w-12 rounded-lg bg-ink-700" />
          <div>
            <div className="text-sm text-white/60">Nothing playing yet</div>
            <div className="text-xs text-white/35">Search for a song to get started</div>
          </div>
          <Link to="/search" className="btn-accent ml-auto h-9 px-4 text-xs">
            Find music
          </Link>
        </div>
      </footer>
    )
  }

  return (
    <footer className="relative z-40 border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl">
      {error ? (
        <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/[0.08] px-4 py-1.5 text-xs text-red-300">
          <span className="truncate">{error}</span>
          <button
            type="button"
            aria-label="Dismiss playback error"
            onClick={dismissError}
            className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-300/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Thin progress line (mobile) */}
      <div className="relative h-0.5 bg-white/10 lg:hidden">
        <div className="absolute inset-y-0 left-0 bg-brand-400 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5 lg:gap-4 lg:px-4 lg:py-3">
        {/* Left: artwork + meta */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-[30%] lg:flex-none">
          <button
            type="button"
            onClick={ui.openNowPlaying}
            aria-label="Open Now Playing"
            className="relative shrink-0 overflow-hidden rounded-lg transition hover:opacity-90"
          >
            <Cover src={current.thumbnail} alt={current.title} className="h-11 w-11 lg:h-14 lg:w-14" rounded="rounded-lg" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white/90">{current.title}</div>
            <div className="truncate text-xs text-white/50">
              {current.artistId ? (
                <Link to={`/artist/${current.artistId}`} className="transition hover:text-white/80 hover:underline">
                  {current.artist}
                </Link>
              ) : (
                current.artist
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            onClick={() => toggleLike(current)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition hover:text-white lg:flex"
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-brand-400 text-brand-400')} />
          </button>
        </div>

        {/* Center: controls (desktop) */}
        <div className="hidden flex-1 flex-col items-center gap-1.5 lg:flex">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Shuffle"
              onClick={toggleShuffle}
              className={cn('transition hover:text-white', shuffle ? 'text-brand-400' : 'text-white/50')}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Previous track"
              onClick={() => prev()}
              className="text-white/70 transition hover:text-white"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              disabled={busy}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-950 transition hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 translate-x-[1px] fill-current" />
              )}
            </button>
            <button
              type="button"
              aria-label="Next track"
              onClick={() => next()}
              className="text-white/70 transition hover:text-white"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
            <button
              type="button"
              aria-label={`Repeat: ${repeat}`}
              onClick={cycleRepeat}
              className={cn('transition hover:text-white', repeat !== 'off' ? 'text-brand-400' : 'text-white/50')}
              title={`Repeat ${repeat}`}
            >
              {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>
          <ProgressBar className="max-w-2xl" />
        </div>

        {/* Right: extras (desktop) */}
        <div className="hidden items-center justify-end gap-2 lg:flex lg:w-[30%]">
          <button
            type="button"
            aria-label="Toggle lyrics"
            onClick={() => ui.toggleRightPanel('lyrics')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white',
              ui.rightPanelOpen && ui.rightPanelTab === 'lyrics' ? 'text-brand-400' : 'text-white/50',
            )}
            title="Lyrics"
          >
            <Mic2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Toggle queue"
            onClick={() => ui.toggleRightPanel('queue')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition hover:text-white',
              ui.rightPanelOpen && ui.rightPanelTab === 'queue' ? 'text-brand-400' : 'text-white/50',
            )}
            title="Queue"
          >
            <ListMusic className="h-4 w-4" />
          </button>
          <VolumeControl />
        </div>

        {/* Center: compact controls (mobile) */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-950 transition active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 translate-x-[1px] fill-current" />
            )}
          </button>
          <button
            type="button"
            aria-label="Next track"
            onClick={() => next()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70"
          >
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
        </div>
      </div>
    </footer>
  )
}
