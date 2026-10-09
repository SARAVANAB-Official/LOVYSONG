import { Link, useParams } from 'react-router-dom'
import { Disc3, Heart, Play, Shuffle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Cover } from '@/components/common/Cover'
import { TrackList } from '@/components/music/TrackList'
import { TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useAlbum } from '@/hooks/queries'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { pluralize } from '@/utils/format'

export function AlbumPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useAlbum(id)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)
  const toggleSavedAlbum = useLibraryStore((s) => s.toggleSavedAlbum)
  const isAlbumSaved = useLibraryStore((s) => s.isAlbumSaved)

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-8 flex items-end gap-6">
          <div className="h-40 w-40 animate-pulse rounded-xl bg-white/[0.06] sm:h-52 sm:w-52" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
        <TrackListSkeleton count={8} />
      </PageContainer>
    )
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <ErrorState title="Couldn't load this album" onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link to="/explore" className="text-sm text-brand-400 hover:text-brand-300">
            ← Back to Explore
          </Link>
        </div>
      </PageContainer>
    )
  }

  const { album, tracks } = data
  const saved = isAlbumSaved(album.browseId)
  const context = { label: album.title, kind: 'album' as const, href: `/album/${album.browseId}` }

  return (
    <PageContainer>
      <div className="animate-fade-up mb-8 flex flex-col items-start gap-6 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end">
        <Cover src={album.thumbnail} alt={album.title} rounded="rounded-xl" className="h-40 w-40 shrink-0 shadow-card sm:h-52 sm:w-52" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">Album</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{album.title}</h1>
          <p className="mt-3 text-sm text-white/55">
            {album.artistId ? (
              <Link to={`/artist/${album.artistId}`} className="font-medium text-white/85 hover:text-white hover:underline">
                {album.artist}
              </Link>
            ) : (
              <span className="text-white/85">{album.artist}</span>
            )}
            {album.year ? ` · ${album.year}` : ''}
            {` · ${pluralize(tracks.length, 'song')}`}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-accent h-11 px-6"
              disabled={!tracks.length}
              onClick={() => void playList(tracks, 0, context)}
            >
              <Play className="h-4 w-4" /> Play
            </button>
            <button
              type="button"
              className="btn-ghost h-11"
              disabled={!tracks.length}
              onClick={() => void playShuffled(tracks, context)}
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <button
              type="button"
              className={saved ? 'btn-ghost h-11 border-brand-500/50 text-brand-300' : 'btn-ghost h-11'}
              onClick={() =>
                toggleSavedAlbum({
                  browseId: album.browseId,
                  title: album.title,
                  artist: album.artist,
                  artistId: album.artistId,
                  year: album.year,
                  thumbnail: album.thumbnail,
                  trackCount: tracks.length,
                })
              }
            >
              <Heart className={saved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<Disc3 className="h-6 w-6" />}
          title="No tracks returned"
          description="This album's track list came back empty from the API."
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
          <TrackList tracks={tracks} context={context} />
        </div>
      )}
    </PageContainer>
  )
}
