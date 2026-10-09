import { usePlayerStore } from '@/stores/playerStore'
import { TrackRow } from '@/components/music/TrackRow'
import { cn } from '@/utils/cn'
import type { QueueContext, Track } from '@/types/music'

interface TrackListProps {
  tracks: Track[]
  context?: QueueContext
  showArtwork?: boolean
  showAlbum?: boolean
  showIndex?: boolean
  onRemove?: (index: number) => void
  className?: string
}

export function TrackList({
  tracks,
  context,
  showArtwork = true,
  showAlbum = false,
  showIndex = true,
  onRemove,
  className,
}: TrackListProps) {
  const currentId = usePlayerStore((s) => s.current?.id ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playList = usePlayerStore((s) => s.playList)

  const handlePlay = (index: number) => {
    void playList(tracks, index, context)
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {tracks.map((track, i) => {
        const active = currentId === track.id
        return (
          <TrackRow
            key={`${track.id}-${i}`}
            track={track}
            index={i}
            active={active}
            playing={active && isPlaying}
            onPlay={handlePlay}
            onRemove={onRemove}
            showArtwork={showArtwork}
            showAlbum={showAlbum}
            showIndex={showIndex}
          />
        )
      })}
    </div>
  )
}
