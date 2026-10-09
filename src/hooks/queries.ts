import { useQuery } from '@tanstack/react-query'
import { veromeApi } from '@/services/veromeApi'
import { probeHealth } from '@/services/apiClient'
import { fetchLyrics } from '@/services/lyricsService'
import type { Lyrics, MusicItem } from '@/types/music'

export const queryKeys = {
  health: ['health'] as const,
  search: (q: string, filter: string) => ['search', q, filter] as const,
  suggestions: (q: string) => ['suggestions', q] as const,
  album: (id: string) => ['album', id] as const,
  artist: (id: string) => ['artist', id] as const,
  playlist: (id: string) => ['playlist', id] as const,
  related: (id: string) => ['related', id] as const,
  charts: (country: string) => ['charts', country] as const,
  moods: ['moods'] as const,
  trending: (country: string) => ['trending', country] as const,
  topArtists: (country: string) => ['top-artists', country] as const,
  topTracks: (country: string) => ['top-tracks', country] as const,
  artistInfo: (name: string) => ['artist-info', name] as const,
  lyrics: (title: string, artist: string) => ['lyrics', title, artist] as const,
}

const DISCOVERY_STALE = 5 * 60_000
const SEARCH_STALE = 60_000

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => probeHealth(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  })
}

export function useSearch(query: string, filter = '', enabled = true) {
  return useQuery({
    queryKey: queryKeys.search(query, filter),
    queryFn: ({ signal }) => veromeApi.search(query, { filter: filter || undefined, signal, fallback: filter === 'songs' }),
    enabled: enabled && query.trim().length > 0,
    staleTime: SEARCH_STALE,
    placeholderData: (prev) => prev,
  })
}

export interface SearchGroups {
  songs: MusicItem[]
  artists: MusicItem[]
  albums: MusicItem[]
  playlists: MusicItem[]
}

/**
 * The backend's unfiltered search only returns the single top hit, so the
 * "All" view fans out to one request per category and merges the results.
 * Fallback resolution is skipped here to keep typing responsive — the
 * playback engine recovers missing fallback IDs on demand.
 */
export function useSearchGroups(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search(query, 'groups'),
    queryFn: async ({ signal }) => {
      const groups = ['songs', 'artists', 'albums', 'playlists'] as const
      const results = await Promise.all(
        groups.map((filter) =>
          veromeApi
            .search(query, { filter, signal, fallback: false })
            .then((r) => r.items)
            .catch((err) => {
              if ((err as { name?: string })?.name === 'AbortError') throw err
              return [] as MusicItem[]
            }),
        ),
      )
      return {
        songs: results[0],
        artists: results[1],
        albums: results[2],
        playlists: results[3],
      } satisfies SearchGroups
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: SEARCH_STALE,
    placeholderData: (prev) => prev,
  })
}

export function useSuggestions(query: string) {
  return useQuery({
    queryKey: queryKeys.suggestions(query),
    queryFn: ({ signal }) => veromeApi.getSuggestions(query, signal),
    enabled: query.trim().length > 1,
    staleTime: 60_000,
  })
}

export function useAlbum(browseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.album(browseId ?? ''),
    queryFn: ({ signal }) => veromeApi.getAlbum(browseId as string, signal),
    enabled: Boolean(browseId),
    staleTime: DISCOVERY_STALE,
  })
}

export function useArtist(browseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.artist(browseId ?? ''),
    queryFn: ({ signal }) => veromeApi.getArtist(browseId as string, signal),
    enabled: Boolean(browseId),
    staleTime: DISCOVERY_STALE,
  })
}

export function usePlaylist(playlistId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.playlist(playlistId ?? ''),
    queryFn: ({ signal }) => veromeApi.getPlaylist(playlistId as string, signal),
    enabled: Boolean(playlistId),
    staleTime: DISCOVERY_STALE,
  })
}

export function useRelated(videoId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.related(videoId ?? ''),
    queryFn: ({ signal }) => veromeApi.getRelated(videoId as string, signal),
    enabled: Boolean(videoId),
    staleTime: DISCOVERY_STALE,
  })
}

export function useCharts(country: string) {
  return useQuery({
    queryKey: queryKeys.charts(country),
    queryFn: ({ signal }) => veromeApi.getCharts(country, signal),
    staleTime: DISCOVERY_STALE,
  })
}

export function useMoods() {
  return useQuery({
    queryKey: queryKeys.moods,
    queryFn: ({ signal }) => veromeApi.getMoods(signal),
    staleTime: 30 * 60_000,
  })
}

export function useTrending(country: string) {
  return useQuery({
    queryKey: queryKeys.trending(country),
    queryFn: ({ signal }) => veromeApi.getTrending(country, signal),
    staleTime: DISCOVERY_STALE,
  })
}

export function useTopArtists(country: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.topArtists(country),
    queryFn: ({ signal }) => veromeApi.getTopArtists(country, limit, signal),
    staleTime: DISCOVERY_STALE,
  })
}

export function useTopTracks(country: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.topTracks(country),
    queryFn: ({ signal }) => veromeApi.getTopTracks(country, limit, signal),
    staleTime: DISCOVERY_STALE,
  })
}

export function useArtistInfo(name: string | undefined) {
  return useQuery({
    queryKey: queryKeys.artistInfo(name ?? ''),
    queryFn: ({ signal }) => veromeApi.getArtistInfo(name as string, signal),
    enabled: Boolean(name),
    staleTime: 30 * 60_000,
  })
}

export function useLyrics(
  title: string | undefined,
  artist: string | undefined,
  duration: number | undefined,
  enabled: boolean,
) {
  return useQuery<Lyrics | null>({
    queryKey: [...queryKeys.lyrics(title ?? '', artist ?? ''), duration ?? 0],
    queryFn: ({ signal }) => fetchLyrics(title as string, artist as string, duration, signal),
    enabled: enabled && Boolean(title && artist),
    staleTime: 30 * 60_000,
    retry: false,
  })
}
