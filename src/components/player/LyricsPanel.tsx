import { useEffect, useMemo, useRef, useState } from 'react'
import { Music2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/common/Skeleton'
import { useLyrics } from '@/hooks/queries'
import { usePlayerStore } from '@/stores/playerStore'
import { cn } from '@/utils/cn'
import { parseDurationText } from '@/utils/format'
import { activeLineIndex } from '@/utils/lrc'

interface LyricsPanelProps {
  className?: string
}

export function LyricsPanel({ className }: LyricsPanelProps) {
  const current = usePlayerStore((s) => s.current)
  const currentTime = usePlayerStore((s) => s.currentTime)

  const { data, isLoading, isError, refetch } = useLyrics(
    current?.title,
    current?.artist,
    parseDurationText(current?.durationText) ?? undefined,
    Boolean(current),
  )

  const lines = useMemo(() => (data?.lines?.length ? data.lines : []), [data])
  const synced = data?.synced === true && lines.some((l) => l.time != null)

  const active = synced ? activeLineIndex(lines, currentTime) : -1

  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [manualScroll, setManualScroll] = useState(false)
  const manualTimer = useRef<number | null>(null)

  // User-scroll override: pause auto-scroll for a few seconds after interaction.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const markManual = () => {
      setManualScroll(true)
      if (manualTimer.current) window.clearTimeout(manualTimer.current)
      manualTimer.current = window.setTimeout(() => setManualScroll(false), 3000)
    }
    el.addEventListener('wheel', markManual, { passive: true })
    el.addEventListener('touchmove', markManual, { passive: true })
    return () => {
      el.removeEventListener('wheel', markManual)
      el.removeEventListener('touchmove', markManual)
      if (manualTimer.current) window.clearTimeout(manualTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!synced || active < 0 || manualScroll) return
    const node = lineRefs.current[active]
    const el = containerRef.current
    if (!node || !el) return
    const target = node.offsetTop - el.clientHeight / 2 + node.clientHeight / 2
    el.scrollTo({ top: target, behavior: 'smooth' })
  }, [active, synced, manualScroll])

  if (!current) {
    return (
      <div className={cn('p-4', className)}>
        <EmptyState icon={<Music2 className="h-6 w-6" />} title="No track playing" description="Lyrics appear here once music starts." />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div ref={containerRef} className="relative flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className={cn('h-4', i % 3 === 0 ? 'w-11/12' : 'w-3/4')} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Lyrics unavailable"
            description="We couldn't reach the lyrics service."
            action={
              <button type="button" className="btn-ghost" onClick={() => void refetch()}>
                Try again
              </button>
            }
          />
        ) : !lines.length ? (
          <EmptyState
            icon={<Music2 className="h-6 w-6" />}
            title="No lyrics found"
            description="This track has no lyrics in the LRCLib database."
          />
        ) : synced ? (
          <div className="space-y-4 py-[30%]">
            {lines.map((line, i) => (
              <p
                key={i}
                ref={(el) => {
                  lineRefs.current[i] = el
                }}
                className={cn(
                  'cursor-pointer text-lg font-semibold leading-snug transition-all duration-300',
                  active === i ? 'scale-[1.02] text-white' : active > i ? 'text-white/30' : 'text-white/45 hover:text-white/70',
                )}
                onClick={() => {
                  if (line.time != null) usePlayerStore.getState().seek(line.time)
                }}
              >
                {line.text || '·'}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-lg font-medium leading-relaxed text-white/85">
            {lines.map((line, i) => (
              <p key={i}>{line.text}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
