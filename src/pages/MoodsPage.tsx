import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, Tag } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { MediaCard } from '@/components/music/MediaCard'
import { TrackCard } from '@/components/music/TrackCard'
import { CardRowSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useMoods, useSearch } from '@/hooks/queries'
import { usePlayerStore } from '@/stores/playerStore'
import { itemToTrack } from '@/services/veromeApi'
import type { Track } from '@/types/music'

export function MoodsPage() {
  const [params, setParams] = useSearchParams()
  const genre = params.get('genre')
  const moods = useMoods()

  return (
    <PageContainer>
      {genre ? (
        <GenreResults genre={genre} onBack={() => setParams({})} />
      ) : (
        <>
          <PageHeader
            eyebrow="Discover"
            title="Moods & genres"
            subtitle="Curated starting points for any moment — tap one to browse matching tracks."
          />

          <div className="mb-6 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-850/70 px-4 py-3 text-xs leading-relaxed text-white/50">
            <Tag className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            <span>
              The Verome <code>/api/moods/:categoryId</code> endpoint currently returns an empty list (its category IDs are
              placeholders), so SonicWave browses each mood through the live search endpoint instead of showing dead links.
            </span>
          </div>

          {moods.isLoading ? (
            <CardRowSkeleton count={10} />
          ) : moods.isError ? (
            <ErrorState title="Couldn't load moods" onRetry={() => void moods.refetch()} />
          ) : !moods.data?.length ? (
            <EmptyState title="No moods available" description="The moods endpoint returned no categories." />
          ) : (
            <div className="space-y-9">
              {moods.data.map((section, si) => (
                <section key={`${section.title}-${si}`} className="animate-fade-up">
                  <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">{section.title}</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {section.items.map((mood) => (
                      <MediaCard
                        key={`${section.title}-${mood.title}`}
                        variant="mood"
                        title={mood.title}
                        subtitle="Browse tracks"
                        href={`/moods?genre=${encodeURIComponent(mood.title)}`}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}

function GenreResults({ genre, onBack }: { genre: string; onBack: () => void }) {
  const { data, isLoading, isError, refetch } = useSearch(genre, 'songs')
  const currentId = usePlayerStore((s) => s.current?.id ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playList = usePlayerStore((s) => s.playList)

  const items = data?.items ?? []
  const tracks: Track[] = items.map(itemToTrack).filter((t): t is Track => t !== null)

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onBack} className="btn-ghost h-9 px-4 text-xs">
          <ArrowLeft className="h-4 w-4" /> All moods
        </button>
        <Link to="/search" className="text-xs text-white/45 transition hover:text-white">
          Open full search
        </Link>
      </div>

      <PageHeader
        eyebrow="Mood"
        title={genre}
        subtitle={`Live results from the Verome search endpoint for “${genre}”.`}
        action={
          tracks.length ? (
            <button
              type="button"
              className="btn-accent h-10"
              onClick={() => void playList(tracks, 0, { label: `${genre} mood`, kind: 'search' })}
            >
              <Search className="h-4 w-4" /> Play all
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <CardRowSkeleton count={6} />
      ) : isError ? (
        <ErrorState title="Search failed" onRetry={() => void refetch()} />
      ) : tracks.length === 0 ? (
        <EmptyState title="Nothing found" description={`No results for “${genre}” right now.`} />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {tracks.map((track, i) => (
            <TrackCard
              key={`${track.id}-${i}`}
              track={track}
              active={currentId === track.id}
              playing={currentId === track.id && isPlaying}
              onPlay={() => void playList(tracks, i, { label: `${genre} mood`, kind: 'search' })}
            />
          ))}
        </div>
      )}
    </>
  )
}
