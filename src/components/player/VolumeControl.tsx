import { useEffect, useRef } from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { Slider } from '@/components/player/Slider'
import { cn } from '@/utils/cn'

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  const lastVolume = useRef(volume)
  useEffect(() => {
    if (volume > 0) lastVolume.current = volume
  }, [volume])

  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => {
          if (muted) setVolume(lastVolume.current || 0.6)
          else toggleMute()
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:text-white"
      >
        <Icon className="h-4 w-4" />
      </button>
      <Slider
        value={muted ? 0 : volume}
        max={1}
        onChange={(v) => setVolume(v)}
        ariaLabel="Volume"
        className="w-24 group-hover/slider:opacity-100"
        fillColor="bg-white"
      />
    </div>
  )
}
