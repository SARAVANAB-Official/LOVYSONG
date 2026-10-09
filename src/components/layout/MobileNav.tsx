import { NavLink } from 'react-router-dom'
import { Compass, Home, Library, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/explore', label: 'Explore', icon: Compass, end: false },
  { to: '/library', label: 'Library', icon: Library, end: false },
]

export function MobileNav() {
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 flex items-stretch justify-around border-t border-white/[0.06] bg-ink-900/95 backdrop-blur-xl md:hidden">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-400' : 'text-white/50',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
