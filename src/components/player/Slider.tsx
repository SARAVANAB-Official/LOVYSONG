import { useCallback, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

interface SliderProps {
  value: number
  max?: number
  onChange: (value: number) => void
  onCommit?: (value: number) => void
  ariaLabel: string
  className?: string
  disabled?: boolean
  thickness?: 'thin' | 'thick'
  fillColor?: string
}

/** Accessible slider used for the playback timeline and volume. */
export function Slider({
  value,
  max = 1,
  onChange,
  onCommit,
  ariaLabel,
  className,
  disabled,
  thickness = 'thin',
  fillColor = 'bg-white',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)

  const clamp = useCallback((v: number) => Math.min(max, Math.max(0, v)), [max])

  const valueFromEvent = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return 0
      const rect = track.getBoundingClientRect()
      const ratio = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width
      return clamp(ratio * max)
    },
    [clamp, max],
  )

  const effective = dragging ? dragValue : value
  const pct = max > 0 ? (effective / max) * 100 : 0

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const v = valueFromEvent(e.clientX)
    setDragging(true)
    setDragValue(v)
    onChange(v)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return
    const v = valueFromEvent(e.clientX)
    setDragValue(v)
    onChange(v)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragging(false)
    onCommit?.(dragValue)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const step = max / 40
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = clamp(value + step)
      onChange(next)
      onCommit?.(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = clamp(value - step)
      onChange(next)
      onCommit?.(next)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(0)
      onCommit?.(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(max)
      onCommit?.(max)
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(effective * 100) / 100}
      aria-disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        'group/slider relative flex cursor-pointer touch-none items-center',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <div className={cn('relative w-full rounded-full bg-white/15', thickness === 'thick' ? 'h-1.5' : 'h-1')}>
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', fillColor)}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
        <div
          className={cn(
            'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow',
            'opacity-0 transition-opacity duration-150 group-hover/slider:opacity-100 group-focus/slider:opacity-100',
            dragging && 'opacity-100',
          )}
          style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  )
}
