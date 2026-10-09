import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ListMusic, Pencil, Play, Shuffle, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Cover } from '@/components/common/Cover'
import { TrackList } from '@/components/music/TrackList'
import { EmptyState } from '@/components/common/EmptyState'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { formatCount, pluralize } from '@/utils/format'

/** Detail view for a locally stored (guest) playlist. */
export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === id))
  const renamePlaylist = useLibraryStore((s) => s.renamePlaylist)
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist)
  const removeTrackFromPlaylist = useLibraryStore((s) => s.removeTrackFromPlaylist)
  const playList = usePlayerStore((s) => s.playList)
  const playShuffled = usePlayerStore((s) => s.playShuffled)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(playlist?.name ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!playlist) {
    return (
      <PageContainer>
        <EmptyState
          icon={<ListMusic className="h-6 w-6" />}
          title="Playlist not found"
          description="It may have been deleted, or it was created in a different browser profile."
          action={
            <Link to="/playlists" className="btn-accent">
              Back to playlists
            </Link>
          }
        />
      </PageContainer>
    )
  }

  const context = { label: playlist.name, kind: 'playlist' as const, href: `/playlists/${playlist.id}` }
  const cover = playlist.tracks[0]?.thumbnail ?? null

  const saveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) renamePlaylist(playlist.id, name.trim())
    setEditing(false)
  }

  return (
    <PageContainer>
      <div className="animate-fade-up mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
        <Cover src={cover} alt={playlist.name} rounded="rounded-xl" className="h-40 w-40 shrink-0 shadow-card sm:h-52 sm:w-52" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">Playlist</div>
          {editing ? (
            <form onSubmit={saveName} className="flex gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="input-field w-full max-w-md font-display text-2xl font-bold"
              />
              <button type="submit" className="btn-accent h-11" aria-label="Save name">
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{playlist.name}</h1>
          )}
          <p className="mt-3 text-sm text-white/50">
            {pluralize(playlist.tracks.length, 'track')} · saved in this browser
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-accent h-11 px-6"
              disabled={!playlist.tracks.length}
              onClick={() => void playList(playlist.tracks, 0, context)}
            >
              <Play className="h-4 w-4" /> Play
            </button>
            <button
              type="button"
              className="btn-ghost h-11"
              disabled={!playlist.tracks.length}
              onClick={() => void playShuffled(playlist.tracks, context)}
            >
              <Shuffle className="h-4 w-4" /> Shuffle
            </button>
            <button type="button" className="btn-ghost h-11" onClick={() => { setName(playlist.name); setEditing(true) }}>
              <Pencil className="h-4 w-4" /> Rename
            </button>
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  className="btn-ghost h-11 border-red-500/40 text-red-300 hover:bg-red-500/15"
                  onClick={() => {
                    deletePlaylist(playlist.id)
                    navigate('/playlists')
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Confirm delete
                </button>
                <button type="button" className="btn-ghost h-11" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className="btn-ghost h-11" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <EmptyState
          icon={<ListMusic className="h-6 w-6" />}
          title="This playlist is empty"
          description="Search for music, then use “Add to playlist” from any track's menu."
          action={
            <Link to="/search" className="btn-accent">
              Find songs
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-ink-850/60 p-3 sm:p-4">
          <TrackList
            tracks={playlist.tracks}
            context={context}
            showAlbum
            onRemove={(index) => {
              const track = playlist.tracks[index]
              if (track) removeTrackFromPlaylist(playlist.id, track.id)
            }}
          />
        </div>
      )}

      <div className="mt-6 text-xs text-white/45">
        {formatCount(playlist.tracks.length)} of your liked/discovered songs can be added here — playlists are not synced to a
        server (the Verome API has no write endpoints).
      </div>
    </PageContainer>
  )
}
