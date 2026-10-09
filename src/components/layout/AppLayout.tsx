import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { RightPanel } from './RightPanel'
import { Toasts } from './Toasts'
import { PlayerBar } from '@/components/player/PlayerBar'
import { NowPlayingOverlay } from '@/components/player/NowPlayingOverlay'
import { AddToPlaylistModal } from '@/components/music/AddToPlaylistModal'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'

export function AppLayout() {
  useGlobalShortcuts()
  const nowPlayingOpen = useUiStore((s) => s.nowPlayingOpen)
  const showCompactSidebar = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')

  const currentId = usePlayerStore((s) => s.current?.id ?? null)
  const addRecent = useLibraryStore((s) => s.addRecent)

  // Record recently-played whenever the active track changes.
  useEffect(() => {
    if (!currentId) return
    const track = usePlayerStore.getState().current
    if (track) addRecent(track)
  }, [currentId, addRecent])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink-950">
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">
          <Sidebar compact={showCompactSidebar} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <RightPanel />
      </div>

      <PlayerBar />
      <MobileNav />

      <AnimatePresence>{nowPlayingOpen ? <NowPlayingOverlay /> : null}</AnimatePresence>
      <AddToPlaylistModal />
      <Toasts />
    </div>
  )
}
