import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useUiStore } from '@/stores/uiStore'

/**
 * Global keyboard shortcuts.
 * - Space: play/pause
 * - Left/Right: seek -/+5s
 * - Up/Down: volume +/-5%
 * - Escape: close overlays
 * Never fires while the user is typing in an input/textarea/contenteditable.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      const ui = useUiStore.getState()

      if (e.key === 'Escape') {
        if (ui.nowPlayingOpen) {
          ui.closeNowPlaying()
          return
        }
        if (ui.rightPanelOpen) {
          ui.closeRightPanel()
          return
        }
      }

      if (isTyping) return

      const player = usePlayerStore.getState()
      switch (e.key) {
        case ' ':
          if (player.current) {
            e.preventDefault()
            player.togglePlay()
          }
          break
        case 'ArrowRight':
          if (player.current) {
            e.preventDefault()
            player.seek(player.currentTime + 5)
          }
          break
        case 'ArrowLeft':
          if (player.current) {
            e.preventDefault()
            player.seek(Math.max(0, player.currentTime - 5))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          player.setVolume(Math.min(1, player.volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          player.setVolume(Math.max(0, player.volume - 0.05))
          break
        case 'm':
        case 'M':
          player.toggleMute()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
