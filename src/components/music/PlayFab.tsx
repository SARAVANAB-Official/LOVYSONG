import { Pause, Play } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PlayFabProps {
  playing?: boolean
  onClick: (e: React.MouseEvent) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  accent?: boolean
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

/** Circular play/pause control used on cards and headers. */
export function PlayFab({ playing, onClick, size = 'md', className, label = 'Play', accent = true }: PlayFabProps) {
  return (
    <button
      type="button"
      aria-label={playing ? 'Pause' : label}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-full shadow-glow transition-all duration-200 active:scale-95',
        accent ? 'bg-brand-500 text-ink-950 hover:bg-brand-400' : 'bg-white/10 text-white hover:bg-white/20',
        sizes[size],
        className,
      )}
    >
      {playing ? <Pause className={cn(iconSizes[size], 'fill-current')} /> : <Play className={cn(iconSizes[size], 'translate-x-[1px] fill-current')} />}
    </button>
  )
}
