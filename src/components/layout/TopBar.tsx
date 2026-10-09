import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ListMusic, Mic2, Wifi, WifiOff } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { useHealth } from '@/hooks/queries'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

function NavArrow({ dir, onClick, disabled }: { dir: 'back' | 'fwd'; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={dir === 'back' ? 'Go back' : 'Go forward'}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {dir === 'back' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  )
}

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: healthy } = useHealth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen)
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel)
  const openNowPlaying = useUiStore((s) => s.openNowPlaying)

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.04] bg-ink-950/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-1.5">
        <NavArrow dir="back" onClick={() => navigate(-1)} />
        <NavArrow dir="fwd" onClick={() => navigate(1)} />
      </div>

      {isDesktop ? (
        <SearchBar className="mx-auto w-full max-w-md" compact />
      ) : (
        <div className="flex-1 text-center font-display text-sm font-semibold text-white/80">
          {location.pathname === '/' ? 'SonicWave' : ''}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div
          title={healthy ? 'Verome API connected' : 'Verome API unreachable'}
          className={cn(
            'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex',
            healthy ? 'border-brand-500/25 bg-brand-dim text-brand-400' : 'border-red-500/25 bg-red-500/10 text-red-400',
          )}
        >
          {healthy ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {healthy ? 'Connected' : 'Offline'}
        </div>

        <button
          type="button"
          aria-label="Toggle lyrics"
          onClick={() => toggleRightPanel('lyrics')}
          className={cn(
            'hidden h-9 w-9 items-center justify-center rounded-full transition lg:flex',
            rightPanelOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white',
          )}
          title="Lyrics"
        >
          <Mic2 className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Toggle queue"
          onClick={() => toggleRightPanel('queue')}
          className={cn(
            'hidden h-9 w-9 items-center justify-center rounded-full transition lg:flex',
            rightPanelOpen ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white',
          )}
          title="Queue"
        >
          <ListMusic className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={openNowPlaying}
          className="btn-accent h-9 px-4 text-xs"
          title="Open Now Playing"
        >
          Now Playing
        </button>
      </div>
    </header>
  )
}
