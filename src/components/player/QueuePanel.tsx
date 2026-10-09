import { ListMusic, X } from 'lucide-react'
import { Cover } from '@/components/common/Cover'
import { EmptyState } from '@/components/common/EmptyState'
import { EqualizerBars } from '@/components/common/EqualizerBars'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

export function QueuePanel() {
  const queue = usePlayerStore((s) => s.queue)
  const index = usePlayerStore((s) => s.index)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const jumpTo = usePlayerStore((s) => s.jumpTo)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const context = usePlayerStore((s) => s.context)
  const toast = useUiStore((s) => s.toast)

  if (queue.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<ListMusic className="h-6 w-6" />}
          title="Your queue is empty"
          description="Search for music and press play to build a queue."
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Queue</div>
          {context?.label ? <div className="truncate text-sm text-white/60">{context.label}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => {
            usePlayerStore.getState().clearQueue()
            toast('Queue cleared')
          }}
          className="text-[11px] font-medium uppercase tracking-wide text-white/40 transition hover:text-white/80"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        {queue.map((track, i) => {
          const active = i === index
          return (
            <div
              key={`${track.id}-${i}`}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.05]',
                active && 'bg-white/[0.06]',
              )}
            >
              <button type="button" onClick={() => jumpTo(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="relative h-9 w-9 shrink-0">
                  <Cover src={track.thumbnail} alt={track.title} className="h-full w-full" rounded="rounded-md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-sm', active ? 'text-brand-400' : 'text-white/85')}>{track.title}</div>
                  <div className="truncate text-xs text-white/45">{track.artist}</div>
                </div>
                {active ? <EqualizerBars playing={isPlaying} className="ml-1 h-3 w-3" /> : null}
              </button>
              <button
                type="button"
                aria-label={`Remove ${track.title} from queue`}
                onClick={() => removeFromQueue(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/30 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
