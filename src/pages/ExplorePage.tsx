import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio, Search, Sparkles } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { MediaCard } from '@/components/music/MediaCard'
import { TrackList } from '@/components/music/TrackList'
import { CardRowSkeleton, TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useMoods, useRelated, useTopArtists, useTopTracks } from '@/hooks/queries'
import { useLibraryStore } from '@/stores/libraryStore'
import { COUNTRIES } from '@/constants/countries'
import { cn } from '@/utils/cn'

/** Discovery hub: search, regional top charts, moods, and one-click radio. */
export function ExplorePage() {
  const [country, setCountry] = useState('US')
  const topArtists = useTopArtists(country, 12)
  const topTracks = useTopTracks(country, 15)
  const moods = useMoods()

  const likedSongs = useLibraryStore((s) => s.likedSongs)
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed)
  const seed = likedSongs[0] ?? recentlyPlayed[0]
  const radio = useRelated(seed?.videoId)

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Discover"
        title="Explore"
        subtitle="Regional top charts, mood-based browsing, and a radio station built from what you already like."
      />

      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-brand-500/10 via-ink-850 to-ink-850 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Find something new</h2>
          <p className="mt-1 text-sm text-white/50">Full-text search across songs, artists, albums and playlists.</p>
        </div>
        <Link to="/search" className="btn-accent h-11 shrink-0 px-5">
          <Search className="h-4 w-4" /> Search music
        </Link>
      </div>

      {/* Radio */}
      <section className="mb-9">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-brand-400" />
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Radio from your library</h2>
        </div>
        {seed ? (
          <>
            <p className="mb-4 text-sm text-white/50">
              Seeded with <span className="text-white/80">{seed.title}</span> — the API’s related endpoint returns roughly 20
              similar tracks.
            </p>
            {radio.isLoading ? (
              <TrackListSkeleton count={5} />
            ) : radio.isError || !radio.data?.length ? (
              <ErrorState title="Couldn’t build a radio station" onRetry={() => void radio.refetch()} />
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
                <TrackList tracks={radio.data} context={{ label: `${seed.title} radio`, kind: 'radio', href: '/explore' }} />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Radio className="h-6 w-6" />}
            title="Nothing to seed a station with"
            description="Like a song or play something first — then SonicWave can build a related-tracks radio for you."
            action={
              <Link to="/search" className="btn-accent">
                Find a song
              </Link>
            }
          />
        )}
      </section>

      {/* Country selector */}
      <div className="mb-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition',
              country === c.code
                ? 'border-brand-500/50 bg-brand-dim text-brand-300'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Top artists */}
      <section className="mb-9">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-400" />
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Top artists</h2>
        </div>
        {topArtists.isLoading ? (
          <CardRowSkeleton count={6} />
        ) : topArtists.isError ? (
          <ErrorState title="Top artists unavailable" onRetry={() => void topArtists.refetch()} />
        ) : topArtists.data?.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {topArtists.data.slice(0, 12).map((a) => (
              <MediaCard key={a.browseId} variant="artist" title={a.name} subtitle={a.subtitle} image={a.thumbnail} href={`/artist/${a.browseId}`} />
            ))}
          </div>
        ) : (
          <EmptyState title="No top artists" description="The artists endpoint returned nothing for this region." />
        )}
      </section>

      {/* Top tracks */}
      <section className="mb-9">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-brand-400" />
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Top tracks</h2>
        </div>
        {topTracks.isLoading ? (
          <TrackListSkeleton count={8} />
        ) : topTracks.isError ? (
          <ErrorState title="Top tracks unavailable" onRetry={() => void topTracks.refetch()} />
        ) : topTracks.data?.length ? (
          <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
            <TrackList tracks={topTracks.data} context={{ label: `Top tracks — ${COUNTRIES.find((c) => c.code === country)?.name}`, kind: 'charts' }} />
          </div>
        ) : (
          <EmptyState title="No top tracks" description="The tracks endpoint returned nothing for this region." />
        )}
      </section>

      {/* Moods */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Moods & genres</h2>
          <Link to="/moods" className="text-xs font-semibold uppercase tracking-wide text-white/45 transition hover:text-white">
            See all
          </Link>
        </div>
        {moods.isLoading ? (
          <CardRowSkeleton count={8} />
        ) : moods.isError ? (
          <ErrorState title="Moods unavailable" onRetry={() => void moods.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {moods.data
              ?.flatMap((s) => s.items)
              .slice(0, 12)
              .map((m) => (
                <MediaCard key={m.title} variant="mood" title={m.title} subtitle="Browse tracks" href={`/moods?genre=${encodeURIComponent(m.title)}`} />
              ))}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
