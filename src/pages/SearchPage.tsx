import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Music2, SearchX, Video } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { SearchBar } from '@/components/search/SearchBar'
import { TrackList } from '@/components/music/TrackList'
import { TrackCard } from '@/components/music/TrackCard'
import { MediaCard } from '@/components/music/MediaCard'
import { CardRowSkeleton, TrackListSkeleton } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearch, useSearchGroups } from '@/hooks/queries'
import { itemToTrack } from '@/services/veromeApi'
import { usePlayerStore } from '@/stores/playerStore'
import { cn } from '@/utils/cn'
import type { MusicItem, Track } from '@/types/music'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'videos', label: 'Videos' },
] as const

const SUGGESTIONS = ['Coldplay', 'Lo-fi beats', 'Jazz classics', 'Taylor Swift', 'Arijit Singh', 'EDM mix']

type TabId = (typeof TABS)[number]['id']

function browseHref(item: MusicItem): string | undefined {
  if (item.type === 'artist' && item.browseId) return `/artist/${item.browseId}`
  if (item.type === 'album' && item.browseId) return `/album/${item.browseId}`
  if (item.type === 'playlist' && (item.browseId || item.playlistId)) {
    return `/playlist/${(item.playlistId ?? item.browseId ?? '').replace(/^VL/, '')}`
  }
  return undefined
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const filter = (params.get('filter') ?? 'all') as TabId

  const [input, setInput] = useState(urlQuery)
  const committed = useRef(urlQuery)

  useEffect(() => {
    if (urlQuery !== committed.current) {
      committed.current = urlQuery
      setInput(urlQuery)
    }
  }, [urlQuery])

  const debouncedQuery = useDebounce(input, 350)
  // The "All" tab fans out to per-category requests; specific tabs use one request.
  const grouped = useSearchGroups(debouncedQuery, filter === 'all')
  const filtered = useSearch(debouncedQuery, filter, filter !== 'all')

  const isAll = filter === 'all'
  const isLoading = isAll ? grouped.isLoading : filtered.isLoading
  const isError = isAll ? grouped.isError : filtered.isError
  const isFetching = isAll ? grouped.isFetching : filtered.isFetching
  const refetch = () => (isAll ? grouped.refetch() : filtered.refetch())

  const currentId = usePlayerStore((s) => s.current?.id ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playList = usePlayerStore((s) => s.playList)

  const single = filtered.data?.items ?? []
  const groups = grouped.data
  const songs = isAll ? (groups?.songs ?? []) : single.filter((i) => i.type === 'song' || i.type === 'video')
  const artists = isAll ? (groups?.artists ?? []) : single.filter((i) => i.type === 'artist')
  const albums = isAll ? (groups?.albums ?? []) : single.filter((i) => i.type === 'album')
  const playlists = isAll ? (groups?.playlists ?? []) : single.filter((i) => i.type === 'playlist')
  const items = isAll ? [...songs, ...artists, ...albums, ...playlists] : single

  const trackContext = { label: `Results for “${debouncedQuery}”`, kind: 'search' as const }
  const playableSongs: Track[] = songs.map(itemToTrack).filter((t): t is Track => t !== null)

  const submit = (q: string) => {
    committed.current = q
    setParams({ q, filter }, { replace: false })
  }

  const setTab = (tab: TabId) => {
    const next = new URLSearchParams(params)
    next.set('filter', tab)
    setParams(next, { replace: true })
  }

  return (
    <PageContainer>
      <div className="sticky top-0 z-20 -mx-4 mb-6 bg-ink-950/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <SearchBar
          initialQuery={input}
          autoFocus
          navigateOnSubmit={false}
          onQueryChange={setInput}
          onSubmit={submit}
          className="mx-auto w-full max-w-2xl"
          placeholder="Search songs, artists, albums, playlists…"
        />
      </div>

      {input.trim().length === 0 ? (
        <div className="animate-fade-up">
          <PageHeader eyebrow="Discover" title="Search" subtitle="Find anything on YouTube Music through the Verome API." />
          <div className="mb-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s)
                  submit(s)
                }}
                className="rounded-full border border-white/10 bg-ink-850 px-4 py-2 text-sm text-white/70 transition hover:border-brand-500/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="Start typing to search"
            description="Try an artist, album, or playlist name. Results update as you type."
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
                  filter === tab.id ? 'bg-white text-ink-950' : 'bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white',
                )}
              >
                {tab.label}
              </button>
            ))}
            {isFetching && !isLoading ? <span className="ml-2 self-center text-xs text-brand-400">Updating…</span> : null}
          </div>

          {isLoading ? (
            filter === 'artists' || filter === 'albums' || filter === 'playlists' ? (
              <CardRowSkeleton count={8} />
            ) : (
              <TrackListSkeleton count={9} />
            )
          ) : isError ? (
            <ErrorState
              title="Search failed"
              message="We couldn't reach the Verome API. Check your connection or try again."
              onRetry={() => void refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title={`No results for “${debouncedQuery}”`}
              description="Try a different spelling or a broader term."
            />
          ) : filter === 'all' ? (
            <div className="space-y-9">
              {playableSongs.length ? (
                <section>
                  <SectionHeading title="Songs" />
                  <TrackList tracks={playableSongs} context={trackContext} />
                </section>
              ) : null}
              {artists.length ? (
                <section>
                  <SectionHeading title="Artists" />
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {artists.map((a) => (
                      <MediaCard key={a.id} variant="artist" title={a.title} image={a.thumbnail} href={browseHref(a)} />
                    ))}
                  </div>
                </section>
              ) : null}
              {albums.length ? (
                <section>
                  <SectionHeading title="Albums" />
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {albums.map((a) => (
                      <MediaCard
                        key={a.id}
                        variant="album"
                        title={a.title}
                        subtitle={a.artists[0]?.name}
                        image={a.thumbnail}
                        href={browseHref(a)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {playlists.length ? (
                <section>
                  <SectionHeading title="Playlists" />
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {playlists.map((p) => (
                      <MediaCard key={p.id} variant="playlist" title={p.title} image={p.thumbnail} href={browseHref(p)} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : filter === 'artists' ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {artists.map((a) => (
                <MediaCard key={a.id} variant="artist" title={a.title} image={a.thumbnail} href={browseHref(a)} />
              ))}
            </div>
          ) : filter === 'albums' || filter === 'playlists' ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {albums.map((a) => (
                <MediaCard key={a.id} variant="album" title={a.title} subtitle={a.artists[0]?.name} image={a.thumbnail} href={browseHref(a)} />
              ))}
              {playlists.map((p) => (
                <MediaCard key={p.id} variant="playlist" title={p.title} image={p.thumbnail} href={browseHref(p)} />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                {filter === 'songs' ? <Music2 className="h-4 w-4 text-brand-400" /> : null}
                {filter === 'videos' ? <Video className="h-4 w-4 text-brand-400" /> : null}
                <span className="text-sm text-white/50">{playableSongs.length} results</span>
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {items.map((item, i) => {
                  const track = itemToTrack(item)
                  if (!track) return null
                  return (
                    <TrackCard
                      key={`${item.id}-${i}`}
                      track={track}
                      active={currentId === track.id}
                      playing={currentId === track.id && isPlaying}
                      onPlay={() => void playList(playableSongs, playableSongs.findIndex((t) => t.id === track.id), trackContext)}
                    />
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  )
}

function SectionHeading({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="font-display text-lg font-bold text-white">{title}</h2>
    </div>
  )
}
