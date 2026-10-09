import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlbumSummary, ArtistSummary, Track } from '@/types/music'

export interface GuestPlaylist {
  id: string
  name: string
  tracks: Track[]
  createdAt: number
  updatedAt: number
}

export interface LibraryState {
  likedSongs: Track[]
  recentlyPlayed: Track[]
  playlists: GuestPlaylist[]
  searchHistory: string[]
  savedAlbums: AlbumSummary[]
  savedArtists: ArtistSummary[]

  isLiked: (id: string) => boolean
  toggleLike: (track: Track) => void
  addRecent: (track: Track) => void
  clearRecent: () => void
  addSearchHistory: (query: string) => void
  removeSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  createPlaylist: (name: string, tracks?: Track[]) => GuestPlaylist
  renamePlaylist: (id: string, name: string) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (id: string, track: Track) => void
  removeTrackFromPlaylist: (id: string, trackId: string) => void
  toggleSavedAlbum: (album: AlbumSummary) => void
  isAlbumSaved: (browseId: string) => boolean
  toggleSavedArtist: (artist: ArtistSummary) => void
  isArtistSaved: (browseId: string) => boolean
}

const MAX_RECENT = 50
const MAX_HISTORY = 12

function uid(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentlyPlayed: [],
      playlists: [],
      searchHistory: [],
      savedAlbums: [],
      savedArtists: [],

      isLiked: (id) => get().likedSongs.some((t) => t.id === id),

      toggleLike: (track) => {
        const { likedSongs } = get()
        const exists = likedSongs.some((t) => t.id === track.id)
        set({ likedSongs: exists ? likedSongs.filter((t) => t.id !== track.id) : [track, ...likedSongs] })
      },

      addRecent: (track) => {
        const rest = get().recentlyPlayed.filter((t) => t.id !== track.id)
        set({ recentlyPlayed: [track, ...rest].slice(0, MAX_RECENT) })
      },

      clearRecent: () => set({ recentlyPlayed: [] }),

      addSearchHistory: (query) => {
        const q = query.trim()
        if (!q) return
        const rest = get().searchHistory.filter((s) => s.toLowerCase() !== q.toLowerCase())
        set({ searchHistory: [q, ...rest].slice(0, MAX_HISTORY) })
      },

      removeSearchHistory: (query) => set({ searchHistory: get().searchHistory.filter((s) => s !== query) }),

      clearSearchHistory: () => set({ searchHistory: [] }),

      createPlaylist: (name, tracks = []) => {
        const now = Date.now()
        const playlist: GuestPlaylist = {
          id: uid(),
          name: name.trim() || 'New Playlist',
          tracks,
          createdAt: now,
          updatedAt: now,
        }
        set({ playlists: [playlist, ...get().playlists] })
        return playlist
      },

      renamePlaylist: (id, name) =>
        set({
          playlists: get().playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p)),
        }),

      deletePlaylist: (id) => set({ playlists: get().playlists.filter((p) => p.id !== id) }),

      addTrackToPlaylist: (id, track) =>
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== id || p.tracks.some((t) => t.id === track.id)) return p
            return { ...p, tracks: [...p.tracks, track], updatedAt: Date.now() }
          }),
        }),

      removeTrackFromPlaylist: (id, trackId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId), updatedAt: Date.now() } : p,
          ),
        }),

      toggleSavedAlbum: (album) => {
        const { savedAlbums } = get()
        const exists = savedAlbums.some((a) => a.browseId === album.browseId)
        set({ savedAlbums: exists ? savedAlbums.filter((a) => a.browseId !== album.browseId) : [album, ...savedAlbums] })
      },
      isAlbumSaved: (browseId) => get().savedAlbums.some((a) => a.browseId === browseId),

      toggleSavedArtist: (artist) => {
        const { savedArtists } = get()
        const exists = savedArtists.some((a) => a.browseId === artist.browseId)
        set({ savedArtists: exists ? savedArtists.filter((a) => a.browseId !== artist.browseId) : [artist, ...savedArtists] })
      },
      isArtistSaved: (browseId) => get().savedArtists.some((a) => a.browseId === browseId),
    }),
    { name: 'sonicwave-library', version: 1 },
  ),
)
