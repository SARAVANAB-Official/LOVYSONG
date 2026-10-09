import { AudioWaveform } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg px-1 py-1" aria-label="SonicWave home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow">
        <AudioWaveform className="h-5 w-5 text-ink-950" />
      </span>
      {!compact ? (
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          Sonic<span className="text-brand-400">Wave</span>
        </span>
      ) : null}
    </Link>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600', className)}>
      <AudioWaveform className="h-5 w-5 text-ink-950" />
    </span>
  )
}
