import { formatTime } from '@/utils/format'
import { usePlayerStore } from '@/stores/playerStore'
import { Slider } from '@/components/player/Slider'

export function ProgressBar({ className }: { className?: string }) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const seek = usePlayerStore((s) => s.seek)
  const current = usePlayerStore((s) => s.current)

  const safeDuration = duration > 0 ? duration : 0
  const safeCurrent = Math.min(currentTime, safeDuration > 0 ? safeDuration : currentTime)

  return (
    <div className={`flex w-full items-center gap-3 ${className ?? ''}`}>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/50">{formatTime(safeCurrent)}</span>
      <Slider
        value={safeCurrent}
        max={safeDuration || 1}
        onChange={(v) => seek(v)}
        ariaLabel="Playback timeline"
        disabled={!current || safeDuration <= 0}
        className="flex-1"
        thickness="thin"
      />
      <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/50">{formatTime(safeDuration)}</span>
    </div>
  )
}
