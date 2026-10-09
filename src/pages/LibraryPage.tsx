import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock, Heart, ListMusic, Music2, Sparkles } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { Cover } from '@/components/common/Cover'
import { EmptyState } from '@/components/common/EmptyState'
import { useLibraryStore } from '@/stores/libraryStore'
import { pluralize } from '@/utils/format'
import { cn } from '@/utils/cn'

interface Shortcut {
  key: string
  title: string
  description: string
  meta: string
  href: string
  icon: React.ReactNode
  accent?: boolean
  thumbnails?: (string | null | undefined)[]
}

export function LibraryPage() {
  const likedSongs = useLibraryStore((s) => s.likedSongs)
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed)
  const playlists = useLibraryStore((s) => s.playlists)
  const savedAlbums = useLibraryStore((s) => s.savedAlbums)
  const savedArtists = useLibraryStore((s) => s.savedArtists)

  const shortcuts: Shortcut[] = [
    {
      key: 'liked',
      title: 'Liked songs',
      description: 'Everything you hearted.',
      meta: pluralize(likedSongs.length, 'song'),
      href: '/liked',
      icon: <Heart className="h-5 w-5" />,
      accent: true,
      thumbnails: likedSongs.slice(0, 4).map((t) => t.thumbnail),
    },
    {
      key: 'recent',
      title: 'Recently played',
      description: 'Your last plays on this device.',
      meta: pluralize(recentlyPlayed.length, 'track'),
      href: '/recent',
      icon: <Clock className="h-5 w-5" />,
      thumbnails: recentlyPlayed.slice(0, 4).map((t) => t.thumbnail),
    },
    {
      key: 'playlists',
      title: 'Playlists',
      description: 'Create and manage your own.',
      meta: pluralize(playlists.length, 'playlist'),
      href: '/playlists',
      icon: <ListMusic className="h-5 w-5" />,
      thumbnails: playlists.map((p) => p.tracks[0]?.thumbnail),
    },
    {
      key: 'albums',
      title: 'Saved albums',
      description: 'Albums you kept for later.',
      meta: pluralize(savedAlbums.length, 'album'),
      href: '/library#albums',
      icon: <Music2 className="h-5 w-5" />,
      thumbnails: savedAlbums.slice(0, 4).map((a) => a.thumbnail),
    },
    {
      key: 'artists',
      title: 'Followed artists',
      description: 'Artists you follow.',
      meta: pluralize(savedArtists.length, 'artist'),
      href: '/library#artists',
      icon: <Sparkles className="h-5 w-5" />,
      thumbnails: savedArtists.slice(0, 4).map((a) => a.thumbnail),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your library"
        title="Library"
        subtitle="Everything you keep lives in this browser — no account, no tracking, no server-side storage."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((s) => (
          <Link
            key={s.key}
            to={s.href}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-5 transition',
              s.accent
                ? 'border-brand-500/30 bg-gradient-to-br from-brand-500/15 to-ink-850 hover:border-brand-500/50'
                : 'border-white/[0.07] bg-ink-850/60 hover:border-white/20 hover:bg-ink-850',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', s.accent ? 'bg-brand-500 text-white' : 'bg-white/[0.06] text-brand-400')}>
                {s.icon}
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/25 transition group-hover:text-white/70" />
            </div>

            <div className="mt-5">
              <h3 className="font-display text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-white/45">{s.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/35">{s.meta}</p>
            </div>

            {s.thumbnails?.some(Boolean) ? (
              <div className="mt-4 flex -space-x-3">
                {s.thumbnails
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((src, i) => (
                    <Cover key={i} src={src} alt="" rounded="rounded-lg" className="h-11 w-11 ring-2 ring-ink-900" />
                  ))}
              </div>
            ) : null}
          </Link>
        ))}
      </div>

      <div id="albums" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">Saved albums</h2>
        {savedAlbums.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {savedAlbums.map((a) => (
              <Link key={a.browseId} to={`/album/${a.browseId}`} className="group">
                <Cover src={a.thumbnail} alt={a.title} rounded="rounded-xl" className="aspect-square w-full shadow-card transition group-hover:scale-[1.02]" />
                <div className="mt-3 truncate text-sm font-semibold text-white/90">{a.title}</div>
                <div className="truncate text-xs text-white/45">{a.artist}</div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No saved albums" description="Open any album and press Save to keep it here." />
        )}
      </div>

      <div id="artists" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-white">Followed artists</h2>
        {savedArtists.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {savedArtists.map((a) => (
              <Link key={a.browseId} to={`/artist/${a.browseId}`} className="group text-center">
                <Cover src={a.thumbnail} alt={a.name} rounded="rounded-full" className="aspect-square w-full shadow-card transition group-hover:scale-[1.02]" />
                <div className="mt-3 truncate text-sm font-semibold text-white/90">{a.name}</div>
                <div className="truncate text-xs text-white/45">{a.subtitle ?? 'Artist'}</div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No followed artists" description="Open any artist and press Follow to keep them here." />
        )}
      </div>
    </PageContainer>
  )
}
