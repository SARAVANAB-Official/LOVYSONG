import { Link } from 'react-router-dom'
import { Heart, Play, Shuffle, Trash2 } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { TrackList } from '@/components/music/TrackList'
import { EmptyState } from '@/components/common/EmptyState'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { formatCount } from '@/utils/format'

export function LikedPage() {
  const likedSongs = useLibraryStore((s) => s.likedSongs)
  const toggleLike = useLibraryStore((s) => s.toggleLike)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)

  const context = { label: 'Liked songs', kind: 'library' as const, href: '/liked' }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your library"
        title="Liked songs"
        subtitle={likedSongs.length ? `${formatCount(likedSongs.length)} song${likedSongs.length === 1 ? '' : 's'} you've liked.` : 'Songs you like show up here.'}
        action={
          likedSongs.length ? (
            <>
              <button type="button" className="btn-ghost h-10" onClick={() => void playShuffled(likedSongs, context)}>
                <Shuffle className="h-4 w-4" /> Shuffle
              </button>
              <button type="button" className="btn-accent h-10" onClick={() => void playList(likedSongs, 0, context)}>
                <Play className="h-4 w-4" /> Play all
              </button>
            </>
          ) : undefined
        }
      />

      {likedSongs.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="No liked songs yet"
          description="Tap the heart on any track to save it here. Your likes are stored locally in this browser."
          action={
            <Link to="/search" className="btn-accent">
              Find music
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
          <TrackList
            tracks={likedSongs}
            context={context}
            showAlbum
            onRemove={(index) => {
              const track = likedSongs[index]
              if (track) toggleLike(track)
            }}
          />
          <div className="mt-4 flex justify-end">
            <span className="flex items-center gap-1.5 text-[11px] text-white/35">
              <Trash2 className="h-3.5 w-3.5" /> Use the row menu or heart icon to remove
            </span>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
