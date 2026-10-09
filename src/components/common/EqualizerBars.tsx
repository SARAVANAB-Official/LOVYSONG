import { cn } from '@/utils/cn'

/** Small animated equalizer used to mark the currently playing row. */
export function EqualizerBars({ playing = true, className }: { playing?: boolean; className?: string }) {
  return (
    <div className={cn('flex h-4 items-end gap-[2px]', className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('w-[2px] rounded-full bg-brand-400', playing ? 'animate-eq' : 'h-1/2')}
          style={playing ? { height: '100%', animationDelay: `${i * 0.14}s` } : undefined}
        />
      ))}
    </div>
  )
}
