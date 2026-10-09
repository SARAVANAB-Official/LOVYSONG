import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playbackEngine } from '@/services/playbackService'
import { usePlayerStore } from './playerStore'
import type { Track } from '@/types/music'

vi.mock('@/services/playbackService', () => ({
  playbackEngine: {
    load: vi.fn(async () => {}),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    stop: vi.fn(),
    setListener: vi.fn(),
  },
}))

const loadMock = vi.mocked(playbackEngine.load)

function track(id: string): Track {
  return { id, videoId: id, title: `Song ${id}`, artist: 'Artist', durationText: '3:00' }
}

const defaults = {
  current: null,
  queue: [],
  index: -1,
  isPlaying: false,
  engineState: 'idle' as const,
  currentTime: 0,
  duration: 0,
  volume: 0.9,
  muted: false,
  shuffle: false,
  repeat: 'off' as const,
  error: null,
  errorRecoverable: false,
  source: null,
  context: undefined,
}

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ ...defaults })
  vi.clearAllMocks()
})

describe('playList', () => {
  it('loads the requested index and stores the queue', async () => {
    const tracks = [track('a'), track('b'), track('c')]
    await usePlayerStore.getState().playList(tracks, 1, { label: 'Search', kind: 'search' })

    const state = usePlayerStore.getState()
    expect(state.queue.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(state.index).toBe(1)
    expect(state.current?.id).toBe('b')
    expect(state.isPlaying).toBe(true)
    expect(state.context).toEqual({ label: 'Search', kind: 'search' })
    expect(loadMock).toHaveBeenCalledTimes(1)
  })

  it('ignores an empty list and clamps out-of-range indexes', async () => {
    await usePlayerStore.getState().playList([], 0)
    expect(usePlayerStore.getState().queue).toEqual([])

    await usePlayerStore.getState().playList([track('a'), track('b')], 99)
    expect(usePlayerStore.getState().index).toBe(1)
  })

  it('starts the queue from a shuffled order', async () => {
    const tracks = [track('a'), track('b'), track('c'), track('d'), track('e')]
    await usePlayerStore.getState().playShuffled(tracks)

    const state = usePlayerStore.getState()
    expect(state.queue).toHaveLength(tracks.length)
    expect(state.queue.map((t) => t.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(state.index).toBe(0)
    expect(state.current?.id).toBe(state.queue[0].id)
  })
})

describe('queue navigation', () => {
  it('advances with next() and only auto-advances past the end when repeat is on', async () => {
    const store = usePlayerStore.getState()
    await store.playList([track('a'), track('b')], 0)

    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().current?.id).toBe('b')

    // A manual next at the end of the queue wraps around.
    usePlayerStore.getState().next()
    expect(usePlayerStore.getState().current?.id).toBe('a')

    usePlayerStore.getState().next()
    // Auto-advance (track finished) with repeat off stops instead of wrapping.
    usePlayerStore.getState().next(true)
    expect(usePlayerStore.getState().current?.id).toBe('b')
    expect(usePlayerStore.getState().isPlaying).toBe(false)
    expect(usePlayerStore.getState().engineState).toBe('ended')

    usePlayerStore.getState().cycleRepeat() // off → all
    usePlayerStore.getState().next(true)
    expect(usePlayerStore.getState().current?.id).toBe('a')
  })

  it('rewinds to the previous track', async () => {
    await usePlayerStore.getState().playList([track('a'), track('b')], 1)
    usePlayerStore.getState().prev()
    expect(usePlayerStore.getState().current?.id).toBe('a')
  })

  it('keeps the current song first when shuffle is enabled', async () => {
    await usePlayerStore.getState().playList([track('a'), track('b'), track('c')], 1)
    usePlayerStore.getState().toggleShuffle()

    const { queue, index, current } = usePlayerStore.getState()
    expect(current?.id).toBe('b')
    expect(queue[index].id).toBe('b')
    expect(queue).toHaveLength(3)
    expect(new Set(queue.map((t) => t.id))).toEqual(new Set(['a', 'b', 'c']))
  })

  it('removes entries from the queue and keeps the index valid', async () => {
    await usePlayerStore.getState().playList([track('a'), track('b'), track('c')], 2)
    usePlayerStore.getState().removeFromQueue(0)
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual(['b', 'c'])
    expect(usePlayerStore.getState().index).toBe(1)
    expect(usePlayerStore.getState().current?.id).toBe('c')
  })

  it('appends to the queue without duplicates', async () => {
    await usePlayerStore.getState().playList([track('a')], 0)
    usePlayerStore.getState().addToQueue(track('b'))
    usePlayerStore.getState().addToQueue(track('b'))
    expect(usePlayerStore.getState().queue).toHaveLength(2)
  })

  it('jumps to an arbitrary queue position', async () => {
    await usePlayerStore.getState().playList([track('a'), track('b'), track('c')], 0)
    usePlayerStore.getState().jumpTo(2)
    expect(usePlayerStore.getState().current?.id).toBe('c')
  })
})

describe('repeat and volume', () => {
  it('cycles repeat modes', () => {
    expect(usePlayerStore.getState().repeat).toBe('off')
    usePlayerStore.getState().cycleRepeat()
    expect(usePlayerStore.getState().repeat).toBe('all')
    usePlayerStore.getState().cycleRepeat()
    expect(usePlayerStore.getState().repeat).toBe('one')
    usePlayerStore.getState().cycleRepeat()
    expect(usePlayerStore.getState().repeat).toBe('off')
  })

  it('clamps volume and clears mute when raising it', () => {
    usePlayerStore.getState().setVolume(5)
    expect(usePlayerStore.getState().volume).toBe(1)
    usePlayerStore.getState().setVolume(-3)
    expect(usePlayerStore.getState().volume).toBe(0)

    usePlayerStore.getState().toggleMute()
    expect(usePlayerStore.getState().muted).toBe(true)
    usePlayerStore.getState().setVolume(0.7)
    expect(usePlayerStore.getState().muted).toBe(false)
  })
})
