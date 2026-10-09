import { Link } from 'react-router-dom'
import { History, Play, Shuffle, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { TrackList } from '@/components/music/TrackList'
import { EmptyState } from '@/components/common/EmptyState'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { formatCount } from '@/utils/format'

export function RecentPage() {
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed)
  const clearRecent = useLibraryStore((s) => s.clearRecent)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)

  const context = { label: 'Recently played', kind: 'library' as const, href: '/recent' }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your library"
        title="Recently played"
        subtitle={
          recentlyPlayed.length
            ? `The last ${formatCount(recentlyPlayed.length)} track${recentlyPlayed.length === 1 ? '' : 's'} you played on this device.`
            : 'Tracks you play will appear here.'
        }
        action={
          recentlyPlayed.length ? (
            <>
              <button type="button" className="btn-ghost h-10" onClick={clearRecent}>
                <Trash2 className="h-4 w-4" /> Clear
              </button>
              <button type="button" className="btn-ghost h-10" onClick={() => void playShuffled(recentlyPlayed, context)}>
                <Shuffle className="h-4 w-4" /> Shuffle
              </button>
              <button type="button" className="btn-accent h-10" onClick={() => void playList(recentlyPlayed, 0, context)}>
                <Play className="h-4 w-4" /> Play all
              </button>
            </>
          ) : undefined
        }
      />

      {recentlyPlayed.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Nothing played yet"
          description="Play anything and it will show up here, newest first (capped at 50 tracks)."
          action={
            <Link to="/" className="btn-accent">
              Start listening
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
          <TrackList tracks={recentlyPlayed} context={context} showAlbum />
        </div>
      )}
    </PageContainer>
  )
}
