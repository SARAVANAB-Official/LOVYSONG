import { NavLink } from 'react-router-dom'
import { ChartBar, Compass, Heart, Home, Library, ListMusic, Play, Search, Sparkles, Tag } from 'lucide-react'
import { Logo } from './Logo'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { cn } from '@/utils/cn'

interface SidebarProps {
  compact?: boolean
  onNavigate?: () => void
}

function Item({
  to,
  icon,
  label,
  compact,
  onNavigate,
}: {
  to: string
  icon: React.ReactNode
  label: string
  compact: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          compact ? 'justify-center px-0' : '',
          isActive
            ? 'bg-white/[0.07] text-white'
            : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90',
        )
      }
      title={compact ? label : undefined}
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">{icon}</span>
      {!compact ? <span className="truncate">{label}</span> : null}
    </NavLink>
  )
}

export function Sidebar({ compact = false, onNavigate }: SidebarProps) {
  const playlists = useLibraryStore((s) => s.playlists)
  const recent = useLibraryStore((s) => s.recentlyPlayed)
  const liked = useLibraryStore((s) => s.likedSongs)
  const current = usePlayerStore((s) => s.current)

  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-6 overflow-hidden border-r border-white/[0.06] bg-ink-900/80 py-5',
        compact ? 'w-[84px] px-3' : 'w-[248px] px-4',
      )}
    >
      <div className="px-1">
        <Logo compact={compact} />
      </div>

      <nav className="flex flex-col gap-1">
        <Item to="/" icon={<Home className="h-5 w-5" />} label="Home" compact={compact} onNavigate={onNavigate} />
        <Item to="/search" icon={<Search className="h-5 w-5" />} label="Search" compact={compact} onNavigate={onNavigate} />
        <Item to="/explore" icon={<Compass className="h-5 w-5" />} label="Explore" compact={compact} onNavigate={onNavigate} />
        <Item to="/charts" icon={<ChartBar className="h-5 w-5" />} label="Charts" compact={compact} onNavigate={onNavigate} />
        <Item to="/moods" icon={<Tag className="h-5 w-5" />} label="Moods & genres" compact={compact} onNavigate={onNavigate} />
      </nav>

      <div className="flex flex-col gap-1">
        <div className={cn('mb-1 flex items-center gap-2 px-3', compact && 'justify-center px-0')}>
          {!compact ? <Library className="h-4 w-4 text-white/40" /> : null}
          {!compact ? <span className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Your Library</span> : null}
        </div>
        <Item to="/library" icon={<Library className="h-5 w-5" />} label="Library" compact={compact} onNavigate={onNavigate} />
        <Item to="/liked" icon={<Heart className="h-5 w-5" />} label="Liked Songs" compact={compact} onNavigate={onNavigate} />
        <Item to="/recent" icon={<Play className="h-5 w-5" />} label="Recently Played" compact={compact} onNavigate={onNavigate} />
        <Item to="/playlists" icon={<ListMusic className="h-5 w-5" />} label="Your Playlists" compact={compact} onNavigate={onNavigate} />
      </div>

      {!compact && playlists.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">Playlists</div>
          <div className="flex flex-col gap-0.5">
            {playlists.map((p) => (
              <NavLink
                key={p.id}
                to={`/playlists/${p.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'truncate rounded-lg px-3 py-1.5 text-sm transition',
                    isActive ? 'bg-white/[0.07] text-white' : 'text-white/50 hover:text-white/90',
                  )
                }
              >
                {p.name}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      {!compact && liked.length === 0 && recent.length === 0 && playlists.length === 0 && current ? (
        <div className="mt-auto rounded-xl border border-white/[0.06] bg-ink-850 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/35">
            <Sparkles className="h-3 w-3" /> Tip
          </div>
          <p className="text-xs leading-relaxed text-white/45">
            Save songs to Liked Songs or build playlists — they live in this browser.
          </p>
        </div>
      ) : null}
    </aside>
  )
}
