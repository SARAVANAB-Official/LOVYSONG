import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Disc3, Heart, Play, Shuffle, UserRound } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Cover } from '@/components/common/Cover'
import { TrackList } from '@/components/music/TrackList'
import { MediaCard } from '@/components/music/MediaCard'
import { SectionRow, SectionItem } from '@/components/music/SectionRow'
import { TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useArtist, useArtistInfo } from '@/hooks/queries'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { pluralize } from '@/utils/format'
import { cn } from '@/utils/cn'

export function ArtistPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useArtist(id)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)
  const toggleSavedArtist = useLibraryStore((s) => s.toggleSavedArtist)
  const isArtistSaved = useLibraryStore((s) => s.isArtistSaved)

  const artistName = data?.artist.name
  const info = useArtistInfo(artistName)
  const [bioOpen, setBioOpen] = useState(false)

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-8 flex items-end gap-6">
          <div className="h-40 w-40 animate-pulse rounded-full bg-white/[0.06] sm:h-52 sm:w-52" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
        <TrackListSkeleton count={6} />
      </PageContainer>
    )
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <ErrorState title="Couldn't load this artist" onRetry={() => void refetch()} />
        <div className="mt-6 text-center">
          <Link to="/explore" className="text-sm text-brand-400 hover:text-brand-300">
            ← Back to Explore
          </Link>
        </div>
      </PageContainer>
    )
  }

  const { artist, topSongs, albums, singles } = data
  const saved = isArtistSaved(artist.browseId)
  const context = { label: artist.name, kind: 'artist' as const, href: `/artist/${artist.browseId}` }
  const bio = info.data?.bio ?? artist.description
  const showReadMore = Boolean(bio && bio.length > 320)

  return (
    <PageContainer>
      <div className="animate-fade-up mb-8 flex flex-col items-start gap-6 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end">
        <Cover
          src={artist.thumbnail ?? info.data?.image ?? null}
          alt={artist.name}
          rounded="rounded-full"
          className="h-40 w-40 shrink-0 shadow-card sm:h-52 sm:w-52"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">Artist</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{artist.name}</h1>
          <p className="mt-3 text-sm text-white/55">
            {artist.subscribers ?? info.data?.listeners ? (
              <>
                <span className="text-white/85">{artist.subscribers ?? `${info.data?.listeners} monthly listeners`}</span>
                {' · '}
              </>
            ) : null}
            {topSongs.length ? pluralize(topSongs.length, 'popular song') : 'No songs returned'}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-accent h-11 px-6"
              disabled={!topSongs.length}
              onClick={() => void playList(topSongs, 0, context)}
            >
              <Play className="h-4 w-4" /> Play
            </button>
            <button
              type="button"
              className="btn-ghost h-11"
              disabled={!topSongs.length}
              onClick={() => void playShuffled(topSongs, context)}
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <button
              type="button"
              className={saved ? 'btn-ghost h-11 border-brand-500/50 text-brand-300' : 'btn-ghost h-11'}
              onClick={() =>
                toggleSavedArtist({
                  browseId: artist.browseId,
                  name: artist.name,
                  thumbnail: artist.thumbnail,
                  subtitle: artist.subscribers ?? null,
                })
              }
            >
              <Heart className={saved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} /> {saved ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      {/* Popular */}
      <section className="mb-9">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">Popular</h2>
        {topSongs.length ? (
          <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
            <TrackList tracks={topSongs} context={context} showAlbum />
          </div>
        ) : (
          <EmptyState title="No popular songs" description="The artist endpoint returned an empty top-songs list." />
        )}
      </section>

      {/* Albums */}
      {albums.length ? (
        <section className="mb-9">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">Albums</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {albums.map((a) => (
              <MediaCard
                key={a.browseId}
                variant="album"
                title={a.title}
                subtitle={[a.year, a.artist].filter(Boolean).join(' · ')}
                image={a.thumbnail}
                href={`/album/${a.browseId}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Singles & EPs */}
      {singles.length ? (
        <SectionRow title="Singles & EPs">
          {singles.map((s) => (
            <SectionItem key={s.browseId}>
              <MediaCard variant="album" title={s.title} subtitle={s.year ?? 'Single'} image={s.thumbnail} href={`/album/${s.browseId}`} />
            </SectionItem>
          ))}
        </SectionRow>
      ) : null}

      {/* About */}
      {bio || info.data?.tags?.length || info.data?.similar?.length ? (
        <section className="mt-9 rounded-2xl border border-white/[0.07] bg-ink-850/60 p-6">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand-400" />
            <h2 className="font-display text-xl font-bold tracking-tight text-white">About</h2>
          </div>

          {bio ? (
            <p className={cn('whitespace-pre-line text-sm leading-relaxed text-white/60', !bioOpen && showReadMore && 'line-clamp-4')}>
              {bio}
            </p>
          ) : null}
          {showReadMore ? (
            <button type="button" className="mt-2 text-xs font-semibold text-brand-400 hover:text-brand-300" onClick={() => setBioOpen((v) => !v)}>
              {bioOpen ? 'Show less' : 'Read more'}
            </button>
          ) : null}

          {info.data?.listeners || info.data?.playcount ? (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {info.data.listeners ? (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/35">Monthly listeners</div>
                  <div className="mt-1 text-lg font-semibold text-white/90">{info.data.listeners}</div>
                </div>
              ) : null}
              {info.data.playcount ? (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/35">Play count</div>
                  <div className="mt-1 text-lg font-semibold text-white/90">{info.data.playcount}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {info.data?.tags?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {info.data.tags.map((t) => (
                <Link
                  key={t}
                  to={`/search?q=${encodeURIComponent(t)}&filter=songs`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 transition hover:border-brand-500/40 hover:text-white"
                >
                  {t}
                </Link>
              ))}
            </div>
          ) : null}

          {info.data?.similar?.length ? (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/35">
                <Disc3 className="h-3.5 w-3.5" /> Fans also like
              </div>
              <div className="flex flex-wrap gap-2">
                {info.data.similar.slice(0, 10).map((name) => (
                  <Link
                    key={name}
                    to={`/search?q=${encodeURIComponent(name)}&filter=artists`}
                    className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/12 hover:text-white"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </PageContainer>
  )
}
