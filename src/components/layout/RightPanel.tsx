import { Mic2, ListMusic, Radio, X } from 'lucide-react'
import { TrackList } from '@/components/music/TrackList'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { TrackListSkeleton } from '@/components/common/Skeleton'
import { QueuePanel } from '@/components/player/QueuePanel'
import { LyricsPanel } from '@/components/player/LyricsPanel'
import { useRelated } from '@/hooks/queries'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore, type RightPanelTab } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const tabs: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'queue', label: 'Queue', icon: <ListMusic className="h-3.5 w-3.5" /> },
  { id: 'lyrics', label: 'Lyrics', icon: <Mic2 className="h-3.5 w-3.5" /> },
  { id: 'related', label: 'Related', icon: <Radio className="h-3.5 w-3.5" /> },
]

function RelatedContent() {
  const current = usePlayerStore((s) => s.current)
  const { data, isLoading, isError, refetch } = useRelated(current?.videoId)

  if (!current) {
    return (
      <div className="p-4">
        <EmptyState title="Nothing playing" description="Related tracks appear here." />
      </div>
    )
  }
  if (isLoading) return <div className="p-3"><TrackListSkeleton count={7} /></div>
  if (isError) return <ErrorState className="m-4" onRetry={() => void refetch()} />
  if (!data?.length) {
    return (
      <div className="p-4">
        <EmptyState title="No related tracks" description="We couldn't find similar music for this track." />
      </div>
    )
  }
  return (
    <div className="px-3 py-4">
      <TrackList tracks={data} context={{ label: 'Related tracks', kind: 'radio', href: undefined }} showIndex={false} />
    </div>
  )
}

export function RightPanel() {
  const open = useUiStore((s) => s.rightPanelOpen)
  const tab = useUiStore((s) => s.rightPanelTab)
  const setTab = useUiStore((s) => s.setRightPanel)
  const close = useUiStore((s) => s.closeRightPanel)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (!isDesktop || !open) return null

  return (
    <section className="hidden w-[336px] shrink-0 flex-col border-l border-white/[0.06] bg-ink-900/70 lg:flex">
      <div className="flex items-center gap-1 border-b border-white/[0.05] px-3 py-2.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              tab === t.id ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <button
          type="button"
          aria-label="Close panel"
          onClick={close}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'queue' ? <QueuePanel /> : null}
        {tab === 'lyrics' ? <LyricsPanel /> : null}
        {tab === 'related' ? <RelatedContent /> : null}
      </div>
    </section>
  )
}
