import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Disc3, Heart, ListEnd, ListPlus, MoreHorizontal, User } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import type { Track } from '@/types/music'

interface TrackMenuProps {
  track: Track
  align?: 'left' | 'right'
  className?: string
}

export function TrackMenu({ track, align = 'right', className }: TrackMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const playNext = usePlayerStore((s) => s.playNext)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const isLiked = useLibraryStore((s) => s.isLiked(track.id))
  const toggleLike = useLibraryStore((s) => s.toggleLike)
  const setAddToPlaylistFor = useUiStore((s) => s.setAddToPlaylistFor)
  const toast = useUiStore((s) => s.toast)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="More options"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
      >
        <MoreHorizontal className="h-4.5 w-4.5" />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute z-40 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 py-1.5 shadow-soft backdrop-blur-xl animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuButton
            icon={<ListEnd className="h-4 w-4" />}
            onClick={() => {
              playNext(track)
              toast('Playing next', 'success')
              setOpen(false)
            }}
          >
            Play next
          </MenuButton>
          <MenuButton
            icon={<ListPlus className="h-4 w-4" />}
            onClick={() => {
              addToQueue(track)
              toast('Added to queue', 'success')
              setOpen(false)
            }}
          >
            Add to queue
          </MenuButton>
          <MenuButton
            icon={<Heart className={cn('h-4 w-4', isLiked && 'fill-brand-400 text-brand-400')} />}
            onClick={() => {
              toggleLike(track)
              setOpen(false)
            }}
          >
            {isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}
          </MenuButton>
          <MenuButton
            icon={<Disc3 className="h-4 w-4" />}
            onClick={() => {
              setAddToPlaylistFor(track)
              setOpen(false)
            }}
          >
            Add to playlist
          </MenuButton>
          {track.artistId ? (
            <Link
              to={`/artist/${track.artistId}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4" /> Go to artist
            </Link>
          ) : null}
          {track.albumId ? (
            <Link
              to={`/album/${track.albumId}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <Disc3 className="h-4 w-4" /> Go to album
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MenuButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
    >
      {icon}
      {children}
    </button>
  )
}
