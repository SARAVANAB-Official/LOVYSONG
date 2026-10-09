import { apiGet } from './apiClient'
import { hiRes } from '@/utils/thumbnail'
import type {
  AlbumDetail,
  AlbumSummary,
  ArtistDetail,
  ArtistInfo,
  ArtistSummary,
  ChartSection,
  Lyrics,
  MediaType,
  MoodSection,
  MusicItem,
  PlaylistDetail,
  Track,
} from '@/types/music'
import type {
  RawAlbumResponse,
  RawArtistInfoResponse,
  RawArtistResponse,
  RawChartSection,
  RawLyricsResponse,
  RawMoodSection,
  RawPlaylistResponse,
  RawRelatedResponse,
  RawSearchItem,
  RawSearchResponse,
  RawSongResponse,
  RawStreamResponse,
  RawSuggestionsResponse,
  RawTopResponse,
  RawTrendingResponse,
} from '@/types/api'

// ─────────────────────────────────────────────────────────────
// Normalization helpers
// ─────────────────────────────────────────────────────────────

function thumbOf(raw: { thumbnails?: { url?: string }[]; thumbnail?: string }): string | undefined {
  return hiRes(raw.thumbnails?.[0]?.url ?? raw.thumbnail)
}

function detectType(browseId?: string | null, resultType?: string): MediaType {
  if (browseId) {
    if (browseId.startsWith('VL')) return 'playlist'
    if (browseId.startsWith('MPRE')) return 'album'
    if (browseId.startsWith('UC')) return 'artist'
    if (browseId.startsWith('RD')) return 'playlist'
  }
  const rt = (resultType ?? '').toLowerCase()
  if (rt === 'song' || rt === 'video' || rt === 'album' || rt === 'artist' || rt === 'playlist') {
    return rt as MediaType
  }
  return 'unknown'
}

/** Normalize a single raw search/browse item into the internal model. */
export function normalizeItem(raw: RawSearchItem): MusicItem | null {
  const title = raw.title ?? raw.name
  if (!title) return null

  const browseId = raw.browseId ?? null
  let videoId = raw.videoId ?? null
  let playlistId: string | null = null
  let type = detectType(browseId, raw.resultType)

  if (browseId?.startsWith('VL')) {
    playlistId = browseId.slice(2).replace(/^VL/, '')
    type = 'playlist'
    videoId = null
  }

  // Without a videoId or browseId the item can't be played or linked anywhere.
  if (!videoId && !browseId) return null

  const id = videoId ?? browseId ?? title
  const artists = (raw.artists ?? [])
    .filter((a) => a?.name)
    .map((a) => ({ name: a.name as string, id: a.id ?? null }))

  return {
    id,
    type,
    title,
    subtitle: raw.subtitle,
    thumbnail: thumbOf(raw),
    videoId: videoId ?? undefined,
    browseId: browseId ?? undefined,
    playlistId,
    durationText: raw.duration ?? null,
    fallbackVideoId: raw.fallbackVideoId ?? null,
    artists,
  }
}

/** Convert a normalized item into a playable Track (null if not playable). */
export function itemToTrack(item: MusicItem): Track | null {
  if (!item.videoId) return null
  return {
    id: item.videoId,
    videoId: item.videoId,
    title: item.title,
    artist: item.artists.map((a) => a.name).join(', ') || item.subtitle || 'Unknown artist',
    artistId: item.artists[0]?.id ?? null,
    durationText: item.durationText ?? null,
    thumbnail: item.thumbnail ?? null,
    fallbackVideoId: item.fallbackVideoId ?? null,
    source: item.source,
  }
}

function normalizeItems(list: RawSearchItem[] | undefined): MusicItem[] {
  if (!Array.isArray(list)) return []
  return list.map(normalizeItem).filter((x): x is MusicItem => x !== null)
}

/** Items mapped to tracks, preserving only playable entries. */
export function toTracks(list: RawSearchItem[] | undefined, fallbackArtist?: string): Track[] {
  return normalizeItems(list)
    .map((item) => {
      const t = itemToTrack(item)
      if (t && fallbackArtist && (!t.artist || t.artist === 'Unknown artist')) t.artist = fallbackArtist
      return t
    })
    .filter((t): t is Track => t !== null)
}

function matchScore(item: MusicItem, target: string): number {
  const a = item.title.toLowerCase().trim()
  const b = target.toLowerCase().trim()
  if (a === b) return 3
  if (a.includes(b) || b.includes(a)) return 2
  return 0
}

// ─────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────

export interface SearchOptions {
  filter?: string
  signal?: AbortSignal
  /** Include per-song YouTube fallback IDs (slower). Only affects song searches. */
  fallback?: boolean
}

export async function search(query: string, options: SearchOptions = {}) {
  const { filter, signal, fallback = true } = options
  const data = await apiGet<RawSearchResponse>('/api/search', {
    params: { q: query, filter, fallback: fallback ? undefined : '0' },
    signal,
    retries: 1,
  })
  return {
    items: normalizeItems(data.results),
    continuationToken: data.continuationToken ?? null,
  }
}

export async function getSuggestions(query: string, signal?: AbortSignal): Promise<string[]> {
  const data = await apiGet<RawSuggestionsResponse>('/api/search/suggestions', {
    params: { q: query },
    signal,
    timeoutMs: 8_000,
    retries: 0,
  })
  return Array.isArray(data.suggestions) ? data.suggestions.filter((s) => typeof s === 'string') : []
}

export async function ytSearch(query: string, filter = 'videos', signal?: AbortSignal): Promise<MusicItem[]> {
  const data = await apiGet<{ results?: any[] }>('/api/yt_search', {
    params: { q: query, filter },
    signal,
    retries: 1,
  })
  const results = Array.isArray(data.results) ? data.results : []
  return results
    .map((r): MusicItem | null => {
      const videoId = r?.videoId ?? r?.id
      if (!videoId) return null
      return {
        id: videoId,
        type: 'video' as MediaType,
        title: r?.title ?? 'Untitled',
        thumbnail: hiRes(r?.thumbnails?.slice?.(-1)?.[0]?.url ?? r?.thumbnail) ?? null,
        videoId,
        artists: r?.channel?.name ? [{ name: r.channel.name, id: r.channel.id ?? null }] : [],
      }
    })
    .filter((x): x is MusicItem => x !== null)
}

export async function getSong(videoId: string, signal?: AbortSignal) {
  const data = await apiGet<RawSongResponse>(`/api/songs/${encodeURIComponent(videoId)}`, { signal, retries: 1 })
  if (!data?.success || !data.song?.videoId) return null
  const track: Track = {
    id: data.song.videoId,
    videoId: data.song.videoId,
    title: data.song.title ?? 'Unknown title',
    artist: data.artist?.name ?? 'Unknown artist',
    artistId: data.artist?.browseId ?? null,
    albumId: data.album?.browseId ?? null,
    durationText: typeof data.song.duration === 'string' ? data.song.duration : null,
    thumbnail: data.song.thumbnail ?? null,
  }
  return track
}

export async function getAlbum(browseId: string, signal?: AbortSignal): Promise<AlbumDetail | null> {
  const data = await apiGet<RawAlbumResponse>(`/api/albums/${encodeURIComponent(browseId)}`, { signal, retries: 1 })
  if (!data?.success || !data.album?.browseId) return null
  const artistName = data.artist?.name ?? null
  const tracks = (data.tracks ?? [])
    .map((t): Track | null => {
      const item = normalizeItem(t)
      const track = item ? itemToTrack(item) : null
      if (!track) return null
      if (!track.artist && artistName) track.artist = artistName
      if (!track.artistId && data.artist?.browseId) track.artistId = data.artist.browseId
      track.album = data.album?.title ?? null
      track.albumId = data.album?.browseId ?? null
      return track
    })
    .filter((t): t is Track => t !== null)

  return {
    album: {
      browseId: data.album.browseId,
      title: data.album.title ?? 'Unknown album',
      artist: artistName,
      artistId: data.artist?.browseId ?? null,
      year: data.album.year ?? null,
      thumbnail: hiRes(data.album.thumbnail),
      trackCount: data.album.trackCount ?? tracks.length,
    },
    tracks,
  }
}

export async function getArtist(browseId: string, signal?: AbortSignal): Promise<ArtistDetail | null> {
  const data = await apiGet<RawArtistResponse>(`/api/artists/${encodeURIComponent(browseId)}`, { signal, retries: 1 })
  if (!data?.success || !data.artist?.name) return null
  const artistName = data.artist.name

  const toArtistTracks = (list: RawSearchItem[] | undefined) =>
    (list ?? [])
      .map((t) => {
        const item = normalizeItem(t)
        const track = item ? itemToTrack(item) : null
        if (track && !track.artist) track.artist = artistName
        if (track && !track.artistId) track.artistId = browseId
        return track
      })
      .filter((t): t is Track => t !== null)

  const toAlbums = (list: RawSearchItem[] | undefined): AlbumSummary[] =>
    (list ?? [])
      .map((a): AlbumSummary | null => {
        if (!a.browseId) return null
        return {
          browseId: a.browseId,
          title: a.title ?? a.name ?? 'Unknown',
          artist: artistName,
          artistId: browseId,
          year: (a as { year?: string }).year ?? null,
          thumbnail: thumbOf(a) ?? null,
        }
      })
      .filter((x): x is AlbumSummary => x !== null)

  return {
    artist: {
      browseId,
      name: artistName,
      description: data.artist.description ?? null,
      thumbnail: hiRes(data.artist.thumbnail),
      subscribers: data.artist.subscribers ?? null,
    },
    topSongs: toArtistTracks(data.topSongs),
    albums: toAlbums(data.albums),
    singles: toAlbums(data.singles),
  }
}

export async function getPlaylist(playlistId: string, signal?: AbortSignal): Promise<PlaylistDetail | null> {
  const clean = playlistId.replace(/^VL/, '')
  const data = await apiGet<RawPlaylistResponse>(`/api/playlists/${encodeURIComponent(clean)}`, { signal, retries: 1 })
  if (!data || (!data.title && !Array.isArray(data.tracks))) return null
  const tracks = toTracks(data.tracks)
  return {
    playlist: {
      id: clean,
      title: data.title ?? 'Unknown playlist',
      thumbnail: hiRes(data.thumbnail),
      author: data.author ?? null,
      trackCount: data.trackCount ?? tracks.length,
    },
    tracks,
  }
}

export async function getRelated(videoId: string, signal?: AbortSignal): Promise<Track[]> {
  const data = await apiGet<RawRelatedResponse>(`/api/related/${encodeURIComponent(videoId)}`, { signal, retries: 1 })
  if (!Array.isArray(data?.data)) return []
  return data.data
    .filter((r) => r?.videoId)
    .map((r) => ({
      id: r.videoId as string,
      videoId: r.videoId as string,
      title: r.title ?? 'Unknown title',
      artist: r.artist ?? 'Unknown artist',
      thumbnail: hiRes(r.thumbnail),
      durationText: r.duration ?? null,
    }))
}

export async function getCharts(country = 'US', signal?: AbortSignal): Promise<ChartSection[]> {
  const data = await apiGet<RawChartSection[]>('/api/charts', { params: { country }, signal, retries: 1 })
  if (!Array.isArray(data)) return []
  return data
    .map((section) => ({
      title: section.title ?? 'Charts',
      items: normalizeItems(section.items),
    }))
    .filter((s) => s.items.length > 0)
}

export async function getMoods(signal?: AbortSignal): Promise<MoodSection[]> {
  const data = await apiGet<RawMoodSection[]>('/api/moods', { signal, retries: 1 })
  if (!Array.isArray(data)) return []
  return data.map((section) => ({
    title: section.title ?? 'Moods',
    items: (section.items ?? [])
      .filter((i) => i?.title)
      .map((i) => ({ title: i.title as string, browseId: i.browseId ?? null })),
  }))
}

export async function getTrending(country = 'United States', signal?: AbortSignal): Promise<Track[]> {
  const data = await apiGet<RawTrendingResponse>('/api/trending', {
    params: { country },
    signal,
    retries: 1,
    timeoutMs: 20_000,
  })
  if (!Array.isArray(data?.tracks)) return []
  return data.tracks
    .filter((t) => t?.videoId)
    .map((t) => ({
      id: t.videoId as string,
      videoId: t.videoId as string,
      title: t.name ?? 'Unknown',
      artist: t.artist ?? '',
      thumbnail: hiRes(t.thumbnail),
      durationText: t.duration ?? null,
    }))
}

export async function getTopArtists(country?: string, limit = 20, signal?: AbortSignal): Promise<ArtistSummary[]> {
  const data = await apiGet<RawTopResponse>('/api/top/artists', {
    params: { country, limit },
    signal,
    retries: 1,
  })
  if (!Array.isArray(data?.artists)) return []
  return data.artists
    .filter((a) => a?.name)
    .map((a) => ({
      browseId: a.browseId ?? '',
      name: a.name as string,
      thumbnail: hiRes(a.thumbnail ?? (a as { image?: string }).image),
      subtitle: (a as { listeners?: string }).listeners ?? null,
    }))
}

export async function getTopTracks(country?: string, limit = 20, signal?: AbortSignal): Promise<Track[]> {
  const data = await apiGet<RawTopResponse>('/api/top/tracks', {
    params: { country, limit },
    signal,
    retries: 1,
  })
  if (!Array.isArray(data?.tracks)) return []
  return data.tracks
    .filter((t) => t?.name)
    .map((t) => ({
      id: t.videoId ?? `top-${t.name}-${t.artist}`,
      videoId: t.videoId ?? '',
      title: t.name as string,
      artist: t.artist ?? '',
      thumbnail: hiRes((t as { thumbnail?: string }).thumbnail),
    }))
    .filter((t) => t.videoId)
}

export async function getLyrics(
  title: string,
  artist: string,
  duration?: number,
  signal?: AbortSignal,
): Promise<Lyrics | null> {
  const data = await apiGet<RawLyricsResponse>('/api/lyrics', {
    params: { title, artist, duration },
    signal,
    retries: 1,
    timeoutMs: 12_000,
  })
  if (!data?.success) return null
  return {
    trackName: data.trackName,
    artistName: data.artistName,
    albumName: data.albumName,
    duration: data.duration,
    plain: data.plainLyrics ?? null,
    syncedRaw: data.syncedLyrics ?? null,
    lines: [],
    synced: Boolean(data.syncedLyrics),
  }
}

export async function getArtistInfo(artist: string, signal?: AbortSignal): Promise<ArtistInfo | null> {
  const data = await apiGet<RawArtistInfoResponse>('/api/artist/info', { params: { artist }, signal, retries: 1 })
  if (!data?.success) return null
  return {
    name: data.name,
    bio: data.bio,
    tags: data.tags ?? [],
    similar: data.similar ?? [],
    listeners: data.stats?.listeners,
    playcount: data.stats?.playcount,
    image: data.image,
  }
}

export async function getStream(videoId: string, signal?: AbortSignal): Promise<RawStreamResponse | null> {
  try {
    const data = await apiGet<RawStreamResponse>('/api/stream', {
      params: { id: videoId },
      signal,
      retries: 0,
      timeoutMs: 12_000,
    })
    return data
  } catch {
    return null
  }
}

export const veromeApi = {
  search,
  getSuggestions,
  ytSearch,
  getSong,
  getAlbum,
  getArtist,
  getPlaylist,
  getRelated,
  getCharts,
  getMoods,
  getTrending,
  getTopArtists,
  getTopTracks,
  getLyrics,
  getArtistInfo,
  getStream,
}

export { matchScore }
