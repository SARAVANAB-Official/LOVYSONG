import { useState } from 'react'
import { Check, ListPlus, Plus, X } from 'lucide-react'
import { Cover } from '@/components/common/Cover'
import { useLibraryStore } from '@/stores/libraryStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

export function AddToPlaylistModal() {
  const track = useUiStore((s) => s.addToPlaylistFor)
  const setTrack = useUiStore((s) => s.setAddToPlaylistFor)
  const toast = useUiStore((s) => s.toast)
  const playlists = useLibraryStore((s) => s.playlists)
  const addTrack = useLibraryStore((s) => s.addTrackToPlaylist)
  const createPlaylist = useLibraryStore((s) => s.createPlaylist)
  const [newName, setNewName] = useState('')

  if (!track) return null

  const close = () => setTrack(null)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Add to playlist"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-soft animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <ListPlus className="h-5 w-5 text-brand-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">Add to playlist</div>
            <div className="truncate text-xs text-white/50">{track.title}</div>
          </div>
          <button type="button" aria-label="Close" onClick={close} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 no-scrollbar">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const name = newName.trim()
              if (!name) return
              const pl = createPlaylist(name, [track])
              setNewName('')
              toast(`Created "${pl.name}"`, 'success')
              close()
            }}
            className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-3 py-2"
          >
            <Plus className="h-4 w-4 shrink-0 text-white/40" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist name…"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button type="submit" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              Create
            </button>
          </form>

          {playlists.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-white/40">
              You have no playlists yet. Create one above to start saving music.
            </p>
          ) : (
            playlists.map((p) => {
              const already = p.tracks.some((t) => t.id === track.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (already) {
                      toast('Already in this playlist', 'info')
                      close()
                      return
                    }
                    addTrack(p.id, track)
                    toast(`Added to "${p.name}"`, 'success')
                    close()
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
                >
                  <Cover
                    src={p.tracks[0]?.thumbnail ?? null}
                    alt=""
                    className="h-10 w-10"
                    rounded="rounded-lg"
                    iconClassName="h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm text-white/85', already && 'text-brand-400')}>{p.name}</div>
                    <div className="text-xs text-white/40">{p.tracks.length} songs</div>
                  </div>
                  {already ? <Check className="h-4 w-4 text-brand-400" /> : null}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
