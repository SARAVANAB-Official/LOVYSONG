import { create } from 'zustand'
import type { Track } from '@/types/music'

export type RightPanelTab = 'queue' | 'lyrics' | 'related'

interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

export interface UiState {
  nowPlayingOpen: boolean
  queueHintOpen: boolean
  rightPanelOpen: boolean
  rightPanelTab: RightPanelTab
  addToPlaylistFor: Track | null
  toasts: Toast[]

  openNowPlaying: () => void
  closeNowPlaying: () => void
  toggleNowPlaying: () => void
  setRightPanel: (tab: RightPanelTab) => void
  toggleRightPanel: (tab?: RightPanelTab) => void
  closeRightPanel: () => void
  setAddToPlaylistFor: (track: Track | null) => void
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  nowPlayingOpen: false,
  queueHintOpen: false,
  rightPanelOpen: false,
  rightPanelTab: 'queue',
  addToPlaylistFor: null,
  toasts: [],

  openNowPlaying: () => set({ nowPlayingOpen: true }),
  closeNowPlaying: () => set({ nowPlayingOpen: false }),
  toggleNowPlaying: () => set({ nowPlayingOpen: !get().nowPlayingOpen }),

  setRightPanel: (tab) => set({ rightPanelTab: tab, rightPanelOpen: true }),
  toggleRightPanel: (tab) => {
    const { rightPanelOpen, rightPanelTab } = get()
    if (tab && tab !== rightPanelTab) return set({ rightPanelTab: tab, rightPanelOpen: true })
    set({ rightPanelOpen: !rightPanelOpen })
  },
  closeRightPanel: () => set({ rightPanelOpen: false }),

  setAddToPlaylistFor: (track) => set({ addToPlaylistFor: track }),

  toast: (message, tone = 'info') => {
    const id = Date.now() + Math.random()
    set({ toasts: [...get().toasts, { id, message, tone }] })
    setTimeout(() => get().dismissToast(id), 3800)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
