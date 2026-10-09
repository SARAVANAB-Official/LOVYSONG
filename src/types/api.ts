/**
 * Loose shapes for the raw Verome API responses.
 * All fields are optional because upstream (YouTube Music scraping) is
 * undocumented and may change without notice. Always validate at the boundary.
 */

export interface RawThumbnail {
  url?: string
  width?: number
  height?: number
}

export interface RawArtist {
  name?: string
  id?: string
}

export interface RawSearchItem {
  title?: string
  name?: string
  thumbnails?: RawThumbnail[]
  thumbnail?: string
  videoId?: string
  browseId?: string
  artists?: RawArtist[]
  duration?: string
  resultType?: string
  subtitle?: string
  fallbackVideoId?: string
  fallbackTitle?: string
}

export interface RawSearchResponse {
  query?: string
  filter?: string
  results?: RawSearchItem[]
  continuationToken?: string | null
}

export interface RawSuggestionsResponse {
  suggestions?: string[]
  source?: string
}

export interface RawSongResponse {
  success?: boolean
  error?: string
  song?: { videoId?: string; title?: string; duration?: string | number; thumbnail?: string }
  artist?: { name?: string; browseId?: string | null }
  album?: { browseId?: string } | null
}

export interface RawAlbumResponse {
  success?: boolean
  error?: string
  album?: {
    browseId?: string
    title?: string
    year?: string | null
    thumbnail?: string | null
    trackCount?: number
  }
  artist?: { name?: string; browseId?: string | null } | null
  tracks?: RawSearchItem[]
}

export interface RawArtistResponse {
  success?: boolean
  error?: string
  artist?: {
    browseId?: string
    name?: string
    description?: string | null
    thumbnail?: string | null
    subscribers?: string | null
  }
  topSongs?: RawSearchItem[]
  albums?: RawSearchItem[]
  singles?: RawSearchItem[]
}

export interface RawPlaylistResponse {
  playlistId?: string
  title?: string
  author?: string
  description?: string
  thumbnail?: string
  trackCount?: number
  tracks?: RawSearchItem[]
}

export interface RawRelatedItem {
  videoId?: string
  title?: string
  artist?: string
  thumbnail?: string
  duration?: string
}

export interface RawRelatedResponse {
  success?: boolean
  data?: RawRelatedItem[]
}

export interface RawChartSection {
  title?: string
  items?: RawSearchItem[]
}

export interface RawMoodSection {
  title?: string
  items?: { title?: string; browseId?: string; color?: number }[]
}

export interface RawTrendingResponse {
  success?: boolean
  country?: string
  tracks?: { name?: string; artist?: string; videoId?: string; thumbnail?: string; duration?: string }[]
  error?: string
}

export interface RawTopResponse {
  success?: boolean
  country?: string
  artists?: { name?: string; browseId?: string; thumbnail?: string; playcount?: string; listeners?: string }[]
  tracks?: { name?: string; artist?: string; videoId?: string; thumbnail?: string; playcount?: string }[]
  error?: string
}

export interface RawStreamUrl {
  url?: string
  quality?: string
  mimeType?: string
  bitrate?: number
  audioQuality?: string
  type?: string
  itag?: number
  proxyHost?: string
}

export interface RawStreamResponse {
  success?: boolean
  service?: string
  instance?: string
  streamingUrls?: RawStreamUrl[]
  metadata?: {
    id?: string
    title?: string
    uploader?: string
    author?: string
    thumbnail?: string
    duration?: number | string
    lengthSeconds?: number | string
    views?: number
    viewCount?: number
  }
  hlsUrl?: string
  error?: string
}

export interface RawLyricsResponse {
  success?: boolean
  error?: string
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  plainLyrics?: string | null
  syncedLyrics?: string | null
}

export interface RawArtistInfoResponse {
  success?: boolean
  error?: string
  name?: string
  bio?: string
  tags?: string[]
  similar?: string[]
  stats?: { listeners?: string; playcount?: string }
  image?: string
}
