import { Link, useParams } from 'react-router-dom'
import { ListMusic, Play, Shuffle, Heart } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Cover } from '@/components/common/Cover'
import { TrackList } from '@/components/music/TrackList'
import { TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { usePlaylist } from '@/hooks/queries'
import { usePlayerStore } from '@/stores/playerStore'
import { pluralize } from '@/utils/format'

/** Remote playlist fetched from the Verome API (`/api/playlist/:id`). */
export function ExternalPlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const playlistId = id?.replace(/^VL/, '')
  const { data, isLoading, isError, refetch } = usePlaylist(playlistId)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)

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
        <ErrorState
          title="Couldn't load this playlist"
          message="The playlist endpoint returned an error. The ID may be invalid or the API may be down."
          onRetry={() => void refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/explore" className="text-sm text-brand-400 hover:text-brand-300">
            ← Back to Explore
          </Link>
        </div>
      </PageContainer>
    )
  }

  const { playlist, tracks } = data
  const context = { label: playlist.title, kind: 'playlist' as const, href: `/playlist/${playlistId}` }

  if (!tracks.length) {
    return (
      <PageContainer>
        <EmptyState
          icon={<ListMusic className="h-6 w-6" />}
          title="This playlist has no tracks"
          description="The API returned the playlist metadata but no playable items."
          action={
            <Link to="/explore" className="btn-accent">
              Explore music
            </Link>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div
        className="animate-fade-up mb-8 flex flex-col items-start gap-6 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end"
        style={
          tracks[0]?.thumbnail
            ? { backgroundImage: `url(${tracks[0].thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <Cover
          src={playlist.thumbnail ?? tracks[0]?.thumbnail ?? null}
          alt={playlist.title}
          rounded="rounded-xl"
          className="h-40 w-40 shrink-0 shadow-card sm:h-52 sm:w-52"
        />
        <div className="min-w-0 flex-1 rounded-xl bg-ink-950/70 p-4 backdrop-blur-sm sm:bg-transparent sm:p-0">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">Playlist</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{playlist.title}</h1>
          <p className="mt-3 text-sm text-white/55">
            {playlist.author ? <span className="text-white/80">{playlist.author}</span> : null}
            {playlist.author ? ' · ' : ''}
            {pluralize(tracks.length, 'song')}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-accent h-11 px-6" onClick={() => void playList(tracks, 0, context)}>
              <Play className="h-4 w-4" /> Play
            </button>
            <button type="button" className="btn-ghost h-11" onClick={() => void playShuffled(tracks, context)}>
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
        <TrackList tracks={tracks} context={context} showAlbum />
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-white/40">
        <Heart className="h-3.5 w-3.5" /> Read-only remote playlist — the Verome API has no write endpoints, so you can play or
        queue these tracks but not edit them. To keep a copy, add songs to a local playlist from their row menu.
      </p>
    </PageContainer>
  )
}
