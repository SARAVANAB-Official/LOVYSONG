import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playbackEngine, type EngineEvent, type PlayerEngineState } from '@/services/playbackService'
import { parseDurationText } from '@/utils/format'
import type { PlaybackSource, QueueContext, RepeatMode, Track } from '@/types/music'

export interface PlayerState {
  current: Track | null
  queue: Track[]
  index: number
  isPlaying: boolean
  engineState: PlayerEngineState
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  error: string | null
  errorRecoverable: boolean
  source: PlaybackSource | null
  context?: QueueContext

  // actions
  playTrack: (track: Track, context?: QueueContext) => Promise<void>
  playList: (tracks: Track[], startIndex: number, context?: QueueContext) => Promise<void>
  playShuffled: (tracks: Track[], context?: QueueContext) => Promise<void>
  togglePlay: () => void
  next: (auto?: boolean) => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
  removeFromQueue: (index: number) => void
  jumpTo: (index: number) => void
  clearQueue: () => void
  stop: () => void
  dismissError: () => void
  _handleEngineEvent: (event: EngineEvent) => void
}

/** Fisher–Yates shuffle that never mutates the input. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function sameTrack(a: Track | null, b: Track): boolean {
  return a != null && a.id === b.id
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      const loadAt = async (index: number) => {
        const { queue } = get()
        const track = queue[index]
        if (!track) return
        set({
          index,
          current: track,
          isPlaying: true,
          engineState: 'resolving',
          currentTime: 0,
          duration: parseDurationText(track.durationText) ?? 0,
          error: null,
          errorRecoverable: false,
          source: null,
        })
        try {
          await playbackEngine.load(track, { autoplay: true })
        } catch {
          set({ engineState: 'error', isPlaying: false })
        }
      }

      const handleEnded = () => {
        const { repeat } = get()
        if (repeat === 'one') {
          playbackEngine.seek(0)
          playbackEngine.play()
          return
        }
        get().next(true)
      }

      const computeNext = (auto: boolean): number | null => {
        const { queue, index, shuffle, repeat } = get()
        if (!queue.length) return null
        if (shuffle && queue.length > 1) {
          let nextIndex = index
          while (nextIndex === index) nextIndex = Math.floor(Math.random() * queue.length)
          return nextIndex
        }
        const candidate = index + 1
        if (candidate < queue.length) return candidate
        if (repeat === 'all') return 0
        return auto ? null : 0
      }

      return {
        current: null,
        queue: [],
        index: -1,
        isPlaying: false,
        engineState: 'idle',
        currentTime: 0,
        duration: 0,
        volume: 0.9,
        muted: false,
        shuffle: false,
        repeat: 'off',
        error: null,
        errorRecoverable: false,
        source: null,
        context: undefined,

        playTrack: async (track, context) => {
          const { current, source, engineState } = get()
          if (sameTrack(current, track) && source && engineState !== 'error') {
            if (!get().isPlaying) playbackEngine.play()
            return
          }
          set({ queue: [track], index: 0, context })
          await loadAt(0)
        },

        playList: async (tracks, startIndex, context) => {
          const playable = tracks.filter((t) => t.videoId)
          if (!playable.length) return
          const safeIndex = Math.min(Math.max(0, startIndex), playable.length - 1)
          const queue = get().shuffle ? [playable[safeIndex], ...shuffled(playable.filter((_, i) => i !== safeIndex))] : playable
          set({ queue, index: get().shuffle ? 0 : safeIndex, context })
          await loadAt(get().index)
        },

        playShuffled: async (tracks, context) => {
          const playable = tracks.filter((t) => t.videoId)
          if (!playable.length) return
          const queue = shuffled(playable)
          set({ queue, index: 0, context })
          await loadAt(0)
        },

        togglePlay: () => {
          const { isPlaying, current, engineState, source, index } = get()
          if (!current) return
          if (isPlaying) {
            playbackEngine.pause()
            return
          }
          // A restored (persisted) track has no loaded source yet — reload it.
          if (!source || engineState === 'idle' || engineState === 'ended') {
            void loadAt(index >= 0 ? index : 0)
            return
          }
          playbackEngine.play()
        },

        next: (auto = false) => {
          const nextIndex = computeNext(auto)
          if (nextIndex == null) {
            playbackEngine.pause()
            set({ isPlaying: false, engineState: 'ended' })
            return
          }
          void loadAt(nextIndex)
        },

        prev: () => {
          const { index, queue, currentTime, repeat } = get()
          if (!queue.length) return
          // Restart the current track if we're past the intro.
          if (currentTime > 4) {
            playbackEngine.seek(0)
            return
          }
          let target = index - 1
          if (target < 0) target = repeat === 'all' ? queue.length - 1 : 0
          void loadAt(target)
        },

        seek: (seconds) => {
          playbackEngine.seek(seconds)
          set({ currentTime: seconds })
        },

        setVolume: (v) => {
          const volume = Math.min(1, Math.max(0, v))
          playbackEngine.setVolume(volume)
          set({ volume, muted: volume > 0 ? false : get().muted })
        },

        toggleMute: () => {
          const muted = !get().muted
          playbackEngine.setMuted(muted)
          set({ muted })
        },

        toggleShuffle: () => {
          const { shuffle, queue, current } = get()
          const next = !shuffle
          if (next && queue.length > 1 && current) {
            const rest = queue.filter((t) => t.id !== current.id)
            const reordered = [current, ...shuffled(rest)]
            set({ shuffle: next, queue: reordered, index: 0 })
          } else {
            set({ shuffle: next })
          }
        },

        cycleRepeat: () => {
          const order: RepeatMode[] = ['off', 'all', 'one']
          const i = order.indexOf(get().repeat)
          set({ repeat: order[(i + 1) % order.length] })
        },

        addToQueue: (track) => {
          const { queue } = get()
          if (queue.some((t) => t.id === track.id)) return
          set({ queue: [...queue, track] })
        },

        playNext: (track) => {
          const { queue, index } = get()
          const without = queue.filter((t) => t.id !== track.id)
          const insertAt = Math.max(0, index + 1)
          const nextQueue = [...without.slice(0, insertAt), track, ...without.slice(insertAt)]
          set({ queue: nextQueue })
        },

        removeFromQueue: (removeIndex) => {
          const { queue, index } = get()
          if (removeIndex < 0 || removeIndex >= queue.length) return
          const nextQueue = queue.filter((_, i) => i !== removeIndex)
          let nextIndex = index
          if (removeIndex < index) nextIndex = index - 1
          else if (removeIndex === index) nextIndex = Math.min(index, nextQueue.length - 1)
          set({ queue: nextQueue, index: nextIndex })
        },

        jumpTo: (target) => {
          if (target < 0 || target >= get().queue.length) return
          void loadAt(target)
        },

        clearQueue: () => set({ queue: get().current ? [get().current as Track] : [], index: get().current ? 0 : -1 }),

        stop: () => {
          playbackEngine.stop()
          set({ isPlaying: false, engineState: 'idle' })
        },

        dismissError: () => set({ error: null, errorRecoverable: false }),

        _handleEngineEvent: (event) => {
          switch (event.type) {
            case 'state': {
              switch (event.state) {
                case 'playing':
                  set({ engineState: 'playing', isPlaying: true, error: null })
                  break
                case 'paused':
                  set({ engineState: 'paused', isPlaying: false })
                  break
                case 'loading':
                  set({ engineState: 'loading' })
                  break
                case 'resolving':
                  set({ engineState: 'resolving' })
                  break
                case 'ended':
                  set({ engineState: 'ended', isPlaying: false })
                  break
                case 'idle':
                  set({ engineState: 'idle', isPlaying: false })
                  break
                case 'error':
                  set({ engineState: 'error', isPlaying: false })
                  break
                default:
                  break
              }
              break
            }
            case 'time':
              set((prev) => ({
                currentTime: event.currentTime,
                duration: event.duration > 0 ? event.duration : prev.duration,
              }))
              break
            case 'source':
              set({ source: event.source })
              break
            case 'ended':
              handleEnded()
              break
            case 'error':
              set({
                error: event.message,
                errorRecoverable: event.recoverable,
                isPlaying: false,
                engineState: event.recoverable ? 'paused' : 'error',
              })
              break
            default:
              break
          }
        },
      }
    },
    {
      name: 'sonicwave-player',
      version: 1,
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        queue: state.queue,
        index: state.index,
        current: state.current,
        context: state.context,
      }),
    },
  ),
)

let initialized = false

/** Wire the engine to the store exactly once. Call from the app root. */
export function initPlayerEngine() {
  if (initialized) return
  initialized = true
  playbackEngine.setListener((event) => usePlayerStore.getState()._handleEngineEvent(event))
  const { volume, muted } = usePlayerStore.getState()
  playbackEngine.setVolume(volume)
  playbackEngine.setMuted(muted)
}
