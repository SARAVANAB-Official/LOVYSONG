/**
 * Normalized internal music models.
 * These are the shapes the whole UI works with, decoupled from the raw API.
 */

export type MediaType = 'song' | 'video' | 'album' | 'artist' | 'playlist' | 'unknown'

export interface ArtistRef {
  name: string
  id?: string | null
}

/** A generic, normalized item returned by search / discovery. */
export interface MusicItem {
  id: string
  type: MediaType
  title: string
  subtitle?: string
  thumbnail?: string | null
  /** Present when the item is directly playable. */
  videoId?: string | null
  /** Present for albums, artists and playlists. */
  browseId?: string | null
  /** For playlists the raw id (without the `VL` prefix). */
  playlistId?: string | null
  durationText?: string | null
  fallbackVideoId?: string | null
  artists: ArtistRef[]
  source?: string
}

/** A playable track. Always has a resolvable id (videoId). */
export interface Track {
  id: string
  videoId: string
  title: string
  artist: string
  artistId?: string | null
  album?: string | null
  albumId?: string | null
  durationText?: string | null
  thumbnail?: string | null
  fallbackVideoId?: string | null
  source?: string
}

export interface AlbumSummary {
  browseId: string
  title: string
  artist?: string | null
  artistId?: string | null
  year?: string | null
  thumbnail?: string | null
  trackCount?: number
}

export interface ArtistSummary {
  browseId: string
  name: string
  thumbnail?: string | null
  subtitle?: string | null
}

export interface PlaylistSummary {
  id: string
  title: string
  thumbnail?: string | null
  author?: string | null
  trackCount?: number
}

export interface AlbumDetail {
  album: AlbumSummary
  tracks: Track[]
}

export interface ArtistDetail {
  artist: ArtistSummary & { description?: string | null; subscribers?: string | null }
  topSongs: Track[]
  albums: AlbumSummary[]
  singles: AlbumSummary[]
}

export interface PlaylistDetail {
  playlist: PlaylistSummary
  tracks: Track[]
}

export interface ChartSection {
  title: string
  items: MusicItem[]
}

export interface MoodItem {
  title: string
  browseId?: string | null
}

export interface MoodSection {
  title: string
  items: MoodItem[]
}

export interface ArtistInfo {
  name?: string
  bio?: string
  tags: string[]
  similar: string[]
  listeners?: string
  playcount?: string
  image?: string
}

export interface LyricsLine {
  /** Time in seconds, or null for an unsynced line. */
  time: number | null
  text: string
}

export interface Lyrics {
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  plain?: string | null
  /** Raw LRC payload when the provider supplies timestamps. */
  syncedRaw?: string | null
  lines: LyricsLine[]
  synced: boolean
}

/** Resolved playback source for a track. */
export type PlaybackSource =
  | { kind: 'audio'; url: string; mimeType?: string; provider: string; instance?: string }
  | { kind: 'youtube'; videoId: string; reason?: string }

export type PlaybackState =
  | 'idle'
  | 'resolving'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error'

export type RepeatMode = 'off' | 'all' | 'one'

export interface QueueContext {
  /** Human label used in the Now Playing / queue header, e.g. "Search results". */
  label?: string
  /** A route we can return to. */
  href?: string
  kind?: 'search' | 'album' | 'artist' | 'playlist' | 'charts' | 'radio' | 'library' | 'single'
}

export interface PlayableQueue {
  tracks: Track[]
  context?: QueueContext
}
