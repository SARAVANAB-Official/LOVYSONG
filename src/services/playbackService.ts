import { baseUrl } from './apiClient'
import { veromeApi } from './veromeApi'
import { logger } from '@/utils/logger'
import type { PlaybackSource, Track } from '@/types/music'
import type { RawStreamUrl } from '@/types/api'

export type PlayerEngineState =
  | 'idle'
  | 'resolving'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'

export type EngineEvent =
  | { type: 'state'; state: PlayerEngineState; detail?: string }
  | { type: 'time'; currentTime: number; duration: number }
  | { type: 'source'; source: PlaybackSource }
  | { type: 'ended' }
  | { type: 'error'; message: string; recoverable: boolean }

type EngineListener = (event: EngineEvent) => void

const SOURCE_TTL_MS = 3 * 60 * 1000

/** Choose the highest-quality audio-only stream. */
export function pickBestAudio(streams: RawStreamUrl[]): RawStreamUrl | null {
  const audioOnly = streams.filter((s) => {
    const t = `${s.mimeType ?? ''} ${s.type ?? ''}`.toLowerCase()
    return s.url && (t.includes('audio') || t.includes('m4a') || t.includes('opus') || t === ' ')
  })
  const pool = audioOnly.length ? audioOnly : streams.filter((s) => s.url)
  if (!pool.length) return null
  return pool.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]
}

/**
 * Centralized playback engine.
 *
 * Strategy:
 *  1. Try a direct audio stream via `GET /api/stream` (proxied through
 *     `/api/proxy` for CORS). When available, this plays through a single
 *     HTMLAudioElement — the best experience.
 *  2. When no direct stream is available (the public Piped/Invidious mirrors
 *     are frequently offline), fall back to the official YouTube IFrame
 *     Player API. This is the only provider-supported playback mechanism
 *     still working when the stream mirrors are down.
 *
 * The engine is a singleton and lives outside React so playback never
 * restarts on re-render or navigation.
 */
class PlaybackEngine {
  private audio: HTMLAudioElement | null = null
  private ytPlayer: any = null
  private ytApiPromise: Promise<void> | null = null
  private ytPlayerReady: Promise<void> | null = null
  private resolveYtReady: (() => void) | null = null
  private ytContainer: HTMLDivElement | null = null

  private listener: EngineListener = () => {}
  private mode: 'audio' | 'youtube' | null = null
  private currentTrack: Track | null = null
  private sourceCache = new Map<string, { source: PlaybackSource; at: number }>()

  private ytFallbackTried = false
  private ytSearchTried = false
  private volume = 1
  private muted = false
  private timePoll: ReturnType<typeof setInterval> | null = null
  private lastState: PlayerEngineState = 'idle'

  setListener(listener: EngineListener) {
    this.listener = listener
  }

  private emit(event: EngineEvent) {
    if (event.type === 'state') this.lastState = event.state
    try {
      this.listener(event)
    } catch (err) {
      logger.error('engine', 'listener threw', err)
    }
  }

  // ── Audio element (lazy) ────────────────────────────────────
  private getAudio(): HTMLAudioElement {
    if (this.audio) return this.audio
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.crossOrigin = 'anonymous'
    audio.addEventListener('loadedmetadata', () => {
      this.emit({ type: 'time', currentTime: audio.currentTime, duration: isFinite(audio.duration) ? audio.duration : 0 })
    })
    audio.addEventListener('durationchange', () => {
      this.emit({ type: 'time', currentTime: audio.currentTime, duration: isFinite(audio.duration) ? audio.duration : 0 })
    })
    audio.addEventListener('timeupdate', () => {
      this.emit({ type: 'time', currentTime: audio.currentTime, duration: isFinite(audio.duration) ? audio.duration : 0 })
    })
    audio.addEventListener('play', () => {
      this.emit({ type: 'state', state: 'playing' })
      this.startAudioPoll()
    })
    audio.addEventListener('playing', () => {
      this.emit({ type: 'state', state: 'playing' })
    })
    audio.addEventListener('pause', () => {
      if (!audio.ended) this.emit({ type: 'state', state: 'paused' })
      this.stopAudioPoll()
    })
    audio.addEventListener('waiting', () => this.emit({ type: 'state', state: 'loading' }))
    audio.addEventListener('ended', () => {
      this.stopAudioPoll()
      this.emit({ type: 'ended' })
    })
    audio.addEventListener('error', () => {
      logger.warn('engine', 'audio element error, falling back to YouTube')
      void this.fallbackToYouTube('Direct audio stream failed')
    })
    this.audio = audio
    this.applyVolumeToAudio()
    return audio
  }

  private startAudioPoll() {
    this.stopAudioPoll()
    this.timePoll = setInterval(() => {
      const a = this.audio
      if (!a) return
      this.emit({ type: 'time', currentTime: a.currentTime, duration: isFinite(a.duration) ? a.duration : 0 })
    }, 500)
  }
  private stopAudioPoll() {
    if (this.timePoll) {
      clearInterval(this.timePoll)
      this.timePoll = null
    }
  }

  // ── Volume ──────────────────────────────────────────────────
  private applyVolumeToAudio() {
    if (!this.audio) return
    this.audio.volume = this.muted ? 0 : this.volume
    this.audio.muted = this.muted
  }
  private applyVolumeToYt() {
    if (!this.ytPlayer?.setVolume) return
    try {
      this.ytPlayer.setVolume(Math.round((this.muted ? 0 : this.volume) * 100))
      if (this.muted) this.ytPlayer.mute?.()
      else this.ytPlayer.unMute?.()
    } catch {
      /* player not ready */
    }
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume))
    if (this.volume > 0) this.muted = false
    this.applyVolumeToAudio()
    this.applyVolumeToYt()
  }
  setMuted(muted: boolean) {
    this.muted = muted
    this.applyVolumeToAudio()
    this.applyVolumeToYt()
  }

  // ── YouTube IFrame API ──────────────────────────────────────
  private ensureContainer() {
    if (this.ytContainer) return
    const div = document.createElement('div')
    div.id = 'sonicwave-yt-engine'
    div.setAttribute('aria-hidden', 'true')
    Object.assign(div.style, {
      position: 'fixed',
      width: '200px',
      height: '120px',
      left: '-9999px',
      top: '0',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    } as CSSStyleDeclaration)
    document.body.appendChild(div)
    this.ytContainer = div
  }

  private loadYtApi(): Promise<void> {
    if (this.ytApiPromise) return this.ytApiPromise
    this.ytApiPromise = new Promise<void>((resolve, reject) => {
      if (window.YT?.Player) {
        resolve()
        return
      }
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve()
      }
      if (!document.querySelector('script[data-sonicwave-yt]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true
        tag.dataset.sonicwaveYt = 'true'
        tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API'))
        document.head.appendChild(tag)
      }
      setTimeout(() => {
        if (window.YT?.Player) resolve()
      }, 8000)
    })
    return this.ytApiPromise
  }

  private async ensurePlayer(): Promise<any> {
    await this.loadYtApi()
    if (this.ytPlayer) {
      await this.ytPlayerReady
      return this.ytPlayer
    }
    this.ensureContainer()
    this.ytPlayerReady = new Promise<void>((resolve) => {
      this.resolveYtReady = resolve
    })
    this.ytPlayer = new window.YT.Player(this.ytContainer, {
      width: '200',
      height: '120',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          this.resolveYtReady?.()
          this.resolveYtReady = null
          this.applyVolumeToYt()
        },
        onStateChange: (e: { data: number }) => this.handleYtState(e.data),
        onError: (e: { data: number }) => this.handleYtError(e.data),
      },
    })
    await this.ytPlayerReady
    return this.ytPlayer
  }

  private handleYtState(state: number) {
    // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    switch (state) {
      case 1:
        this.emit({ type: 'state', state: 'playing' })
        this.startYtPoll()
        break
      case 2:
        this.emit({ type: 'state', state: 'paused' })
        this.stopAudioPoll()
        break
      case 0:
        this.stopAudioPoll()
        this.emit({ type: 'ended' })
        break
      case 3:
        this.emit({ type: 'state', state: 'loading' })
        break
      default:
        break
    }
  }

  private startYtPoll() {
    this.stopAudioPoll()
    this.timePoll = setInterval(() => {
      const p = this.ytPlayer
      if (!p?.getCurrentTime) return
      const current = p.getCurrentTime() || 0
      const duration = p.getDuration ? p.getDuration() || 0 : 0
      this.emit({ type: 'time', currentTime: current, duration })
    }, 500)
  }

  private handleYtError(code: number) {
    // 2 invalid param, 5 HTML5 error, 100 removed/private, 101/150 embedding disabled
    logger.warn('engine', 'YouTube player error', code)
    const track = this.currentTrack
    if (!track) {
      this.emit({ type: 'error', message: 'Playback failed.', recoverable: false })
      return
    }
    if (!this.ytFallbackTried && track.fallbackVideoId && track.fallbackVideoId !== track.videoId) {
      this.ytFallbackTried = true
      logger.info('engine', 'trying fallback video id', track.fallbackVideoId)
      this.loadYt(track.fallbackVideoId, true)
      return
    }
    if (!this.ytSearchTried) {
      this.ytSearchTried = true
      void this.searchAndPlayAlternative(track)
      return
    }
    this.emit({
      type: 'error',
      message: 'This track cannot be played (embedding disabled or unavailable).',
      recoverable: false,
    })
  }

  private async searchAndPlayAlternative(track: Track) {
    try {
      const results = await veromeApi.ytSearch(`${track.title} ${track.artist} official`, 'videos')
      const alt = results.find((r) => r.videoId && !(r.artists?.[0]?.name ?? '').includes('Topic'))
      if (alt?.videoId) {
        logger.info('engine', 'found alternative via yt_search', alt.videoId)
        this.loadYt(alt.videoId, true)
        return
      }
    } catch (err) {
      logger.warn('engine', 'yt_search alternative failed', err)
    }
    this.emit({ type: 'error', message: 'No playable source found for this track.', recoverable: false })
  }

  private loadYt(videoId: string, autoplay: boolean) {
    if (!this.ytPlayer) return
    this.mode = 'youtube'
    this.emit({ type: 'state', state: 'loading' })
    try {
      if (autoplay) this.ytPlayer.loadVideoById(videoId)
      else this.ytPlayer.cueVideoById(videoId)
    } catch (err) {
      logger.warn('engine', 'loadYt failed', err)
    }
  }

  // ── Source resolution ───────────────────────────────────────
  async resolveSource(track: Track, signal?: AbortSignal): Promise<PlaybackSource> {
    const cached = this.sourceCache.get(track.videoId)
    if (cached && Date.now() - cached.at < SOURCE_TTL_MS) return cached.source

    const data = await veromeApi.getStream(track.videoId, signal)
    if (data?.success && Array.isArray(data.streamingUrls) && data.streamingUrls.length) {
      const best = pickBestAudio(data.streamingUrls)
      if (best?.url) {
        const source: PlaybackSource = {
          kind: 'audio',
          url: `${baseUrl()}/api/proxy?url=${encodeURIComponent(best.url)}`,
          mimeType: best.mimeType,
          provider: data.service ?? 'stream',
          instance: data.instance,
        }
        this.sourceCache.set(track.videoId, { source, at: Date.now() })
        return source
      }
    }
    return { kind: 'youtube', videoId: track.videoId }
  }

  // ── Public control ──────────────────────────────────────────
  async load(track: Track, options: { autoplay?: boolean } = {}, signal?: AbortSignal) {
    const autoplay = options.autoplay ?? true
    this.currentTrack = track
    this.ytFallbackTried = false
    this.ytSearchTried = false
    this.emit({ type: 'state', state: 'resolving' })

    let source: PlaybackSource
    try {
      source = await this.resolveSource(track, signal)
    } catch (err) {
      logger.warn('engine', 'resolveSource failed, defaulting to YouTube', err)
      source = { kind: 'youtube', videoId: track.videoId }
    }
    this.emit({ type: 'source', source })

    if (source.kind === 'audio') {
      this.mode = 'audio'
      const audio = this.getAudio()
      audio.src = source.url
      audio.load()
      if (autoplay) await this.safePlayAudio()
      else this.emit({ type: 'state', state: 'paused' })
    } else {
      this.mode = 'youtube'
      try {
        await this.ensurePlayer()
        this.loadYt(source.videoId, autoplay)
      } catch (err) {
        this.emit({ type: 'error', message: 'Could not initialize the player.', recoverable: false })
        logger.error('engine', 'ensurePlayer failed', err)
      }
    }
  }

  private async safePlayAudio() {
    const audio = this.getAudio()
    try {
      await audio.play()
    } catch (err) {
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError') {
        this.emit({ type: 'state', state: 'paused' })
        this.emit({ type: 'error', message: 'Playback was blocked by the browser. Press play to start.', recoverable: true })
      } else {
        logger.warn('engine', 'audio.play() failed', err)
        await this.fallbackToYouTube('Direct audio playback failed')
      }
    }
  }

  private async fallbackToYouTube(reason: string) {
    const track = this.currentTrack
    if (!track || this.mode === 'youtube') return
    logger.info('engine', `falling back to YouTube: ${reason}`)
    this.sourceCache.delete(track.videoId)
    this.mode = 'youtube'
    try {
      await this.ensurePlayer()
      this.loadYt(track.videoId, true)
    } catch (err) {
      logger.error('engine', 'fallback failed', err)
      this.emit({ type: 'error', message: 'No playable source found.', recoverable: false })
    }
  }

  play() {
    if (this.mode === 'youtube' && this.ytPlayer?.playVideo) {
      this.emit({ type: 'state', state: 'loading' })
      this.ytPlayer.playVideo()
    } else {
      void this.safePlayAudio()
    }
  }
  pause() {
    if (this.mode === 'youtube' && this.ytPlayer?.pauseVideo) this.ytPlayer.pauseVideo()
    else this.audio?.pause()
  }
  seek(seconds: number) {
    const target = Math.max(0, seconds)
    if (this.mode === 'youtube' && this.ytPlayer?.seekTo) this.ytPlayer.seekTo(target, true)
    else if (this.audio) this.audio.currentTime = target
  }
  getCurrentTime(): number {
    if (this.mode === 'youtube' && this.ytPlayer?.getCurrentTime) return this.ytPlayer.getCurrentTime() || 0
    return this.audio?.currentTime ?? 0
  }
  getDuration(): number {
    if (this.mode === 'youtube' && this.ytPlayer?.getDuration) return this.ytPlayer.getDuration() || 0
    return this.audio && isFinite(this.audio.duration) ? this.audio.duration : 0
  }
  getMode() {
    return this.mode
  }
  getLastState() {
    return this.lastState
  }

  stop() {
    this.stopAudioPoll()
    if (this.audio) {
      this.audio.pause()
      this.audio.removeAttribute('src')
    }
    if (this.ytPlayer?.stopVideo) {
      try {
        this.ytPlayer.stopVideo()
      } catch {
        /* noop */
      }
    }
    this.mode = null
    this.emit({ type: 'state', state: 'idle' })
  }
}

export const playbackEngine = new PlaybackEngine()
