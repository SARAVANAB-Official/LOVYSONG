import { beforeEach, describe, expect, it } from 'vitest'
import { useLibraryStore } from './libraryStore'
import type { Track } from '@/types/music'

function track(id: string, title = `Song ${id}`): Track {
  return { id, videoId: id, title, artist: 'Artist', durationText: '3:00' }
}

const empty = {
  likedSongs: [],
  recentlyPlayed: [],
  playlists: [],
  searchHistory: [],
  savedAlbums: [],
  savedArtists: [],
}

beforeEach(() => {
  useLibraryStore.setState({ ...empty })
})

describe('likes', () => {
  it('adds and removes liked tracks', () => {
    const { toggleLike, isLiked } = useLibraryStore.getState()
    toggleLike(track('a'))
    expect(isLiked('a')).toBe(true)
    expect(useLibraryStore.getState().likedSongs).toHaveLength(1)

    toggleLike(track('a'))
    expect(useLibraryStore.getState().isLiked('a')).toBe(false)
    expect(useLibraryStore.getState().likedSongs).toHaveLength(0)
  })

  it('removes a track when it is toggled again', () => {
    const { toggleLike } = useLibraryStore.getState()
    toggleLike(track('a'))
    toggleLike(track('b'))
    expect(useLibraryStore.getState().likedSongs.map((t) => t.id)).toEqual(['b', 'a'])

    toggleLike(track('a'))
    expect(useLibraryStore.getState().likedSongs.map((t) => t.id)).toEqual(['b'])
  })
})

describe('recently played', () => {
  it('caps the list and de-duplicates', () => {
    const { addRecent } = useLibraryStore.getState()
    for (let i = 0; i < 60; i++) addRecent(track(`t${i}`))
    expect(useLibraryStore.getState().recentlyPlayed).toHaveLength(50)

    addRecent(track('t59'))
    const list = useLibraryStore.getState().recentlyPlayed
    expect(list[0].id).toBe('t59')
    expect(list.filter((t) => t.id === 't59')).toHaveLength(1)
  })

  it('clears history', () => {
    useLibraryStore.getState().addRecent(track('x'))
    useLibraryStore.getState().clearRecent()
    expect(useLibraryStore.getState().recentlyPlayed).toEqual([])
  })
})

describe('playlists', () => {
  it('creates, renames and deletes playlists', () => {
    const created = useLibraryStore.getState().createPlaylist('Road Trip')
    expect(useLibraryStore.getState().playlists[0].name).toBe('Road Trip')

    useLibraryStore.getState().renamePlaylist(created.id, '  Renamed  ')
    expect(useLibraryStore.getState().playlists[0].name).toBe('Renamed')

    useLibraryStore.getState().deletePlaylist(created.id)
    expect(useLibraryStore.getState().playlists).toHaveLength(0)
  })

  it('adds tracks once and removes them by id', () => {
    const created = useLibraryStore.getState().createPlaylist('Mix')
    useLibraryStore.getState().addTrackToPlaylist(created.id, track('a'))
    useLibraryStore.getState().addTrackToPlaylist(created.id, track('a'))
    expect(useLibraryStore.getState().playlists[0].tracks).toHaveLength(1)

    useLibraryStore.getState().removeTrackFromPlaylist(created.id, 'a')
    expect(useLibraryStore.getState().playlists[0].tracks).toHaveLength(0)
  })

  it('falls back to a default name for blank input', () => {
    const created = useLibraryStore.getState().createPlaylist('   ')
    expect(created.name).toBe('New Playlist')
  })
})

describe('saved albums and artists', () => {
  it('toggles saved albums', () => {
    const album = { browseId: 'MPRE1', title: 'Album' }
    useLibraryStore.getState().toggleSavedAlbum(album)
    expect(useLibraryStore.getState().isAlbumSaved('MPRE1')).toBe(true)
    useLibraryStore.getState().toggleSavedAlbum(album)
    expect(useLibraryStore.getState().isAlbumSaved('MPRE1')).toBe(false)
  })

  it('toggles followed artists', () => {
    const artist = { browseId: 'UC1', name: 'Artist' }
    useLibraryStore.getState().toggleSavedArtist(artist)
    expect(useLibraryStore.getState().isArtistSaved('UC1')).toBe(true)
    useLibraryStore.getState().toggleSavedArtist(artist)
    expect(useLibraryStore.getState().isArtistSaved('UC1')).toBe(false)
  })
})

describe('search history', () => {
  it('is case-insensitive, de-duplicated and capped', () => {
    useLibraryStore.getState().addSearchHistory('  hello ')
    useLibraryStore.getState().addSearchHistory('HELLO')
    expect(useLibraryStore.getState().searchHistory).toEqual(['HELLO'])

    for (let i = 0; i < 20; i++) useLibraryStore.getState().addSearchHistory(`q${i}`)
    expect(useLibraryStore.getState().searchHistory).toHaveLength(12)

    useLibraryStore.getState().removeSearchHistory('HELLO')
    expect(useLibraryStore.getState().searchHistory).not.toContain('HELLO')
    useLibraryStore.getState().clearSearchHistory()
    expect(useLibraryStore.getState().searchHistory).toEqual([])
  })

  it('ignores blank queries', () => {
    useLibraryStore.getState().addSearchHistory('   ')
    expect(useLibraryStore.getState().searchHistory).toEqual([])
  })
})
