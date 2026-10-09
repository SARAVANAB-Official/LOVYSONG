import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListMusic, Plus, X } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { MediaCard } from '@/components/music/MediaCard'
import { EmptyState } from '@/components/common/EmptyState'
import { useLibraryStore } from '@/stores/libraryStore'
import { formatCount } from '@/utils/format'

export function PlaylistsPage() {
  const navigate = useNavigate()
  const playlists = useLibraryStore((s) => s.playlists)
  const createPlaylist = useLibraryStore((s) => s.createPlaylist)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const playlist = createPlaylist(trimmed)
    setName('')
    setCreating(false)
    navigate(`/playlists/${playlist.id}`)
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Your library"
        title="Playlists"
        subtitle={
          playlists.length
            ? `${playlists.length} playlist${playlists.length === 1 ? '' : 's'} stored in this browser.`
            : 'Create playlists and add any track from the row menus.'
        }
        action={
          <button type="button" className="btn-accent h-10" onClick={() => setCreating((v) => !v)}>
            {creating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {creating ? 'Cancel' : 'New playlist'}
          </button>
        }
      />

      {creating ? (
        <form onSubmit={submit} className="mb-7 flex gap-2 rounded-2xl border border-white/[0.08] bg-ink-850/70 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            className="input-field flex-1"
            maxLength={80}
          />
          <button type="submit" className="btn-accent h-11" disabled={!name.trim()}>
            Create
          </button>
        </form>
      ) : null}

      {playlists.length === 0 && !creating ? (
        <EmptyState
          icon={<ListMusic className="h-6 w-6" />}
          title="No playlists yet"
          description="Playlists are saved locally — no account required. Create one, then add tracks from any song's menu."
          action={
            <button type="button" className="btn-accent" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Create your first playlist
            </button>
          }
        />
      ) : playlists.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {playlists.map((p) => (
            <MediaCard
              key={p.id}
              variant="playlist"
              title={p.name}
              subtitle={`${formatCount(p.tracks.length)} track${p.tracks.length === 1 ? '' : 's'} · local`}
              image={p.tracks[0]?.thumbnail ?? null}
              href={`/playlists/${p.id}`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/45">
        <Link to="/library" className="transition hover:text-white">
          ← Back to library
        </Link>
        <span>·</span>
        <Link to="/search" className="transition hover:text-white">
          Find songs to add
        </Link>
      </div>
    </PageContainer>
  )
}
