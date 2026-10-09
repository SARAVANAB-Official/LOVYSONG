import { Link } from 'react-router-dom'
import { Clock3, Heart, ListMusic, Play, Radio, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionRow, SectionItem } from '@/components/music/SectionRow'
import { MediaCard } from '@/components/music/MediaCard'
import { TrackCard } from '@/components/music/TrackCard'
import { TrackList } from '@/components/music/TrackList'
import { CardRowSkeleton, TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Cover } from '@/components/common/Cover'
import { useCharts, useMoods, useRelated, useTopArtists, useTopTracks, useTrending } from '@/hooks/queries'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { greeting } from '@/utils/format'
import type { Track } from '@/types/music'

const COUNTRY = 'United States'

export function HomePage() {
  const trending = useTrending(COUNTRY)
  const charts = useCharts('US')
  const topArtists = useTopArtists('US')
  const topTracks = useTopTracks('US')
  const moods = useMoods()

  const liked = useLibraryStore((s) => s.likedSongs)
  const recent = useLibraryStore((s) => s.recentlyPlayed)
  const playlists = useLibraryStore((s) => s.playlists)

  const seedForRelated = liked.find((t) => t.videoId)?.videoId ?? recent.find((t) => t.videoId)?.videoId
  const related = useRelated(seedForRelated)

  const currentId = usePlayerStore((s) => s.current?.id ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playList = usePlayerStore((s) => s.playList)

  const featured = trending.data?.[0]
  const trendingTracks: Track[] = (trending.data ?? []).slice(1, 13)

  const refreshAll = () => {
    void trending.refetch()
    void charts.refetch()
    void topArtists.refetch()
    void topTracks.refetch()
    void moods.refetch()
  }

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <div className="text-sm text-white/45">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {greeting()}
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            Pick up where you left off, or discover something new powered by the Verome API.
          </p>
        </div>
        <button type="button" onClick={refreshAll} className="btn-ghost h-9 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Quick access */}
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickCard to="/liked" icon={<Heart className="h-5 w-5" />} label="Liked Songs" count={liked.length} gradient />
        <QuickCard to="/recent" icon={<Clock3 className="h-5 w-5" />} label="Recently Played" count={recent.length} />
        <QuickCard to="/playlists" icon={<ListMusic className="h-5 w-5" />} label="Your Playlists" count={playlists.length} />
      </div>

      {/* Featured */}
      {featured ? (
        <section className="mb-11 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-ink-850 to-ink-900 shadow-soft animate-fade-up">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <Cover
              src={featured.thumbnail}
              alt={featured.title}
              className="aspect-square w-full max-w-[220px] shrink-0 shadow-2xl ring-1 ring-white/10"
              rounded="rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
                <TrendingUp className="h-3.5 w-3.5" /> Featured · Trending
              </div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{featured.title}</h2>
              <p className="mt-1 text-sm text-white/55">{featured.artist}</p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  className="btn-accent h-11 px-6"
                  onClick={() => void playList([featured, ...(trending.data ?? []).slice(1, 20)], 0, { label: 'Trending music', kind: 'charts' })}
                >
                  <Play className="h-4 w-4 fill-current" /> Play now
                </button>
                <Link to="/charts" className="btn-ghost h-11">
                  <Radio className="h-4 w-4" /> Explore charts
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Recently played */}
      {recent.length > 0 ? (
        <SectionRow title="Recently played" subtitle="Your listening history in this browser" seeAllHref="/recent" className="mb-11">
          {recent.slice(0, 12).map((track) => (
            <SectionItem key={`recent-${track.id}`}>
              <TrackCard
                track={track}
                active={currentId === track.id}
                playing={currentId === track.id && isPlaying}
                onPlay={() => void playList(recent.slice(0, 20), recent.findIndex((t) => t.id === track.id), { label: 'Recently played', kind: 'library' })}
              />
            </SectionItem>
          ))}
        </SectionRow>
      ) : null}

      {/* Trending */}
      <section className="mb-11">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Trending now</h2>
            <p className="mt-0.5 text-sm text-white/45">Discovered through the Verome trending endpoint</p>
          </div>
          {trending.data?.length ? (
            <button
              type="button"
              className="btn-accent h-9 px-4 text-xs"
              onClick={() => void playList(trending.data, 0, { label: 'Trending music', kind: 'charts' })}
            >
              <Play className="h-4 w-4 fill-current" /> Play all
            </button>
          ) : null}
        </div>
        {trending.isLoading ? (
          <CardRowSkeleton count={6} />
        ) : trending.isError ? (
          <EmptyState title="Trending unavailable" description="We couldn't reach the trending endpoint." />
        ) : trendingTracks.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {trendingTracks.map((track, i) => (
              <TrackCard
                key={`${track.id}-${i}`}
                track={track}
                active={currentId === track.id}
                playing={currentId === track.id && isPlaying}
                onPlay={() => void playList(trending.data ?? [], i + 1, { label: 'Trending music', kind: 'charts' })}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No trending tracks" description="The endpoint returned no results right now." />
        )}
      </section>

      {/* Top tracks list */}
      <section className="mb-11">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Top tracks</h2>
            <p className="mt-0.5 text-sm text-white/45">Popular tracks, ranked by the source provider</p>
          </div>
          {topTracks.data?.length ? (
            <button
              type="button"
              className="btn-accent h-9 px-4 text-xs"
              onClick={() => void playList(topTracks.data, 0, { label: 'Top tracks', kind: 'charts' })}
            >
              <Play className="h-4 w-4 fill-current" /> Play all
            </button>
          ) : null}
        </div>
        {topTracks.isLoading ? (
          <TrackListSkeleton count={7} />
        ) : topTracks.data?.length ? (
          <TrackList tracks={topTracks.data.slice(0, 10)} context={{ label: 'Top tracks', kind: 'charts' }} />
        ) : (
          <EmptyState title="No top tracks" description="This endpoint didn't return playable results." />
        )}
      </section>

      {/* Popular artists */}
      {topArtists.isLoading || topArtists.data?.length ? (
        <SectionRow
          title="Popular artists"
          seeAllHref="/explore"
          className="mb-11"
        >
          {topArtists.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SectionItem key={i}>
                <div className="space-y-3">
                  <div className="aspect-square w-full animate-pulse rounded-full bg-white/[0.06]" />
                  <div className="mx-auto h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                </div>
              </SectionItem>
            ))
          ) : (
            (topArtists.data ?? []).slice(0, 12).map((artist) => (
              <SectionItem key={artist.browseId || artist.name}>
                <MediaCard
                  variant="artist"
                  title={artist.name}
                  image={artist.thumbnail}
                  subtitle={artist.subtitle ?? undefined}
                  href={artist.browseId ? `/artist/${artist.browseId}` : undefined}
                />
              </SectionItem>
            ))
          )}
        </SectionRow>
      ) : null}

      {/* Moods */}
      {moods.data?.length ? (
        <section className="mb-11">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Moods & genres</h2>
            <p className="mt-0.5 text-sm text-white/45">Curated starting points</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(moods.data[0]?.items ?? []).slice(0, 10).map((mood) => (
              <MediaCard
                key={mood.title}
                variant="mood"
                title={mood.title}
                href={`/moods?genre=${encodeURIComponent(mood.title)}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Related / similar */}
      {related.data?.length ? (
        <SectionRow
          title={liked.length ? 'More like what you love' : 'More to discover'}
          subtitle="Similar music based on your recent listening"
          className="mb-11"
        >
          {related.data.slice(0, 12).map((track, i) => (
            <SectionItem key={`rel-${track.id}-${i}`}>
              <TrackCard
                track={track}
                active={currentId === track.id}
                playing={currentId === track.id && isPlaying}
                onPlay={() => void playList(related.data ?? [], i, { label: 'Similar tracks', kind: 'radio' })}
              />
            </SectionItem>
          ))}
        </SectionRow>
      ) : null}

      {/* Charts preview */}
      {charts.data?.length ? (
        <section className="mb-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">Charts</h2>
              <p className="mt-0.5 text-sm text-white/45">Regional and genre chart playlists</p>
            </div>
            <Link to="/charts" className="text-xs font-semibold uppercase tracking-wide text-white/45 transition hover:text-white">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(charts.data[0]?.items ?? []).slice(0, 5).map((item) => (
              <MediaCard
                key={item.id}
                variant="playlist"
                title={item.title}
                subtitle={item.subtitle}
                image={item.thumbnail}
                href={item.browseId ? `/playlist/${item.browseId.replace(/^VL/, '')}` : undefined}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Empty home */}
      {!trending.isLoading && !trending.data?.length && recent.length === 0 && liked.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Welcome to SonicWave"
          description="Search for your favorite music to start listening."
          action={
            <Link to="/search" className="btn-accent">
              Search music
            </Link>
          }
        />
      ) : null}
    </PageContainer>
  )
}

function QuickCard({
  to,
  icon,
  label,
  count,
  gradient,
}: {
  to: string
  icon: React.ReactNode
  label: string
  count: number
  gradient?: boolean
}) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 hover-lift ${
        gradient ? 'bg-gradient-to-r from-brand-600/80 to-brand-500/40' : 'bg-ink-850 border border-white/[0.06]'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${gradient ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-brand-400'}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-white/50">{count} {count === 1 ? 'item' : 'items'}</span>
      </span>
      <Play className="ml-auto h-5 w-5 text-white/70 opacity-0 transition group-hover:opacity-100" />
    </Link>
  )
}
