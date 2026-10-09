import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Disc3,
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { Cover } from '@/components/common/Cover'
import { ProgressBar } from '@/components/player/ProgressBar'
import { VolumeControl } from '@/components/player/VolumeControl'
import { LyricsPanel } from '@/components/player/LyricsPanel'
import { QueuePanel } from '@/components/player/QueuePanel'
import { TrackList } from '@/components/music/TrackList'
import { ErrorState } from '@/components/common/ErrorState'
import { TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useArtworkColor } from '@/hooks/useArtworkColor'
import { useRelated } from '@/hooks/queries'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

function RelatedContent() {
  const current = usePlayerStore((s) => s.current)
  const { data, isLoading, isError, refetch } = useRelated(current?.videoId)
  if (isLoading) return <TrackListSkeleton count={6} />
  if (isError) return <ErrorState className="my-4" onRetry={() => void refetch()} />
  if (!data?.length) return <EmptyState title="No related tracks" description="Nothing similar was found." />
  return <TrackList tracks={data} context={{ label: 'Related tracks', kind: 'radio' }} showIndex={false} />
}

type OverlayTab = 'lyrics' | 'queue' | 'related'

export function NowPlayingOverlay() {
  const close = useUiStore((s) => s.closeNowPlaying)
  const tab = useUiStore((s) => (s.rightPanelTab as OverlayTab))
  const setTab = useUiStore((s) => s.setRightPanel)

  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const engineState = usePlayerStore((s) => s.engineState)
  const source = usePlayerStore((s) => s.source)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)

  const isLiked = useLibraryStore((s) => (current ? s.isLiked(current.id) : false))
  const toggleLike = useLibraryStore((s) => s.toggleLike)

  const color = useArtworkColor(current?.thumbnail)
  const [localTab, setLocalTab] = useState<OverlayTab>('lyrics')
  const activeTab = tab === 'queue' || tab === 'lyrics' || tab === 'related' ? tab : localTab

  const busy = engineState === 'resolving' || engineState === 'loading'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!current) return null

  const wash = color ?? '#0e3b2c'

  const attribution =
    source?.kind === 'audio'
      ? `Direct audio stream · ${source.provider}${source.instance ? '' : ''}`
      : source?.kind === 'youtube'
        ? 'YouTube official embed'
        : 'Resolving source…'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto"
      style={{
        background: `radial-gradient(120% 90% at 50% -10%, ${wash}cc 0%, ${wash}55 28%, rgba(5,6,7,0.98) 62%, #050607 100%)`,
      }}
      role="dialog"
      aria-label="Now Playing"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-4 backdrop-blur-sm sm:px-8">
        <button
          type="button"
          onClick={close}
          aria-label="Close Now Playing"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">Now Playing</div>
          <div className="text-xs text-white/45">{attribution}</div>
        </div>
        <div className="w-10" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-10 sm:px-8 lg:flex-row lg:items-center lg:gap-14 lg:pb-20">
        {/* Left: artwork + meta + controls */}
        <div className="flex flex-1 flex-col items-center text-center">
          <motion.div
            key={current.id}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[380px]"
          >
            <Cover
              src={current.thumbnail}
              alt={current.title}
              className="aspect-square w-full shadow-2xl ring-1 ring-white/10"
              rounded="rounded-2xl"
            />
          </motion.div>

          <div className="mt-7 w-full max-w-[440px]">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {current.title}
            </h1>
            <div className="mt-1.5 flex items-center justify-center gap-2 text-sm text-white/60">
              {current.artistId ? (
                <Link to={`/artist/${current.artistId}`} onClick={close} className="transition hover:text-white hover:underline">
                  {current.artist}
                </Link>
              ) : (
                <span>{current.artist}</span>
              )}
              {current.albumId ? (
                <>
                  <span className="text-white/30">·</span>
                  <Link to={`/album/${current.albumId}`} onClick={close} className="transition hover:text-white hover:underline">
                    {current.album}
                  </Link>
                </>
              ) : null}
              <button
                type="button"
                aria-label={isLiked ? 'Unlike' : 'Like'}
                onClick={() => toggleLike(current)}
                className="ml-1"
              >
                <Heart className={cn('h-4 w-4 transition', isLiked ? 'fill-brand-400 text-brand-400' : 'text-white/45 hover:text-white')} />
              </button>
            </div>

            <ProgressBar className="mt-6" />

            <div className="mt-5 flex items-center justify-center gap-5 sm:gap-7">
              <button
                type="button"
                aria-label="Shuffle"
                onClick={toggleShuffle}
                className={cn('transition hover:text-white', shuffle ? 'text-brand-400' : 'text-white/50')}
              >
                <Shuffle className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Previous" onClick={() => prev()} className="text-white/80 transition hover:text-white">
                <SkipBack className="h-6 w-6 fill-current" />
              </button>
              <button
                type="button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={togglePlay}
                disabled={busy}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-950 shadow-glow transition hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {busy ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="h-7 w-7 translate-x-[2px] fill-current" />
                )}
              </button>
              <button type="button" aria-label="Next" onClick={() => next()} className="text-white/80 transition hover:text-white">
                <SkipForward className="h-6 w-6 fill-current" />
              </button>
              <button
                type="button"
                aria-label={`Repeat: ${repeat}`}
                onClick={cycleRepeat}
                className={cn('transition hover:text-white', repeat !== 'off' ? 'text-brand-400' : 'text-white/50')}
              >
                {repeat === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <VolumeControl />
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <Disc3 className="h-3 w-3" /> {attribution}
              </span>
            </div>
          </div>
        </div>

        {/* Right: tabs */}
        <div className="flex min-h-[460px] w-full flex-col rounded-3xl border border-white/10 bg-black/35 backdrop-blur-2xl lg:max-w-[440px]">
          <div className="flex gap-1 border-b border-white/10 p-3">
            {(
              [
                { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
                { id: 'queue', label: 'Queue', icon: ListMusic },
                { id: 'related', label: 'Related', icon: Radio },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setLocalTab(t.id)
                  setTab(t.id)
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition',
                  activeTab === t.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80',
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'lyrics' ? <LyricsPanel /> : null}
            {activeTab === 'queue' ? <QueuePanel /> : null}
            {activeTab === 'related' ? <RelatedContent /> : null}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
