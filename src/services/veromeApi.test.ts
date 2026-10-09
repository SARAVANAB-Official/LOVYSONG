import { describe, expect, it } from 'vitest'
import { itemToTrack, normalizeItem, toTracks } from './veromeApi'
import type { RawSearchItem } from '@/types/api'

const song: RawSearchItem = {
  title: 'Yellow',
  videoId: 'video-123',
  resultType: 'song',
  duration: '4:29',
  thumbnails: [{ url: 'https://yt3.ggpht.com/art=w120-h120-c-k-no0' }],
  artists: [{ name: 'Coldplay', id: 'UC123' }],
}

describe('normalizeItem', () => {
  it('normalizes a playable song', () => {
    const item = normalizeItem(song)
    expect(item).toMatchObject({
      id: 'video-123',
      type: 'song',
      title: 'Yellow',
      durationText: '4:29',
      artists: [{ name: 'Coldplay', id: 'UC123' }],
    })
    expect(item?.thumbnail).toBe('https://yt3.ggpht.com/art=w544-h544-c-k-no0')
  })

  it('detects playlist / album / artist browse ids by prefix', () => {
    expect(normalizeItem({ title: 'Hits', browseId: 'VLPL123', resultType: 'album' })).toMatchObject({
      type: 'playlist',
      playlistId: 'PL123',
      id: 'VLPL123',
    })
    const playlist = normalizeItem({ title: 'Hits', browseId: 'VLPL123', videoId: 'should-be-dropped' })
    expect(playlist?.videoId).toBeUndefined()
    expect(normalizeItem({ title: 'Album', browseId: 'MPRE123', resultType: 'album' })).toMatchObject({ type: 'album' })
    expect(normalizeItem({ title: 'Artist', browseId: 'UC123', resultType: 'artist' })).toMatchObject({ type: 'artist' })
  })

  it('drops items that cannot be represented', () => {
    expect(normalizeItem({ subtitle: 'no title at all' })).toBeNull()
    expect(normalizeItem({ title: 'Ghost' })).toBeNull()
  })

  it('falls back to name and keeps fallback video ids', () => {
    const item = normalizeItem({ name: 'Playlist', browseId: 'RD123', fallbackVideoId: 'fb-1' })
    expect(item?.title).toBe('Playlist')
    expect(item?.type).toBe('playlist')
    expect(item?.fallbackVideoId).toBe('fb-1')
  })
})

describe('itemToTrack', () => {
  it('returns null for non-playable items', () => {
    expect(itemToTrack(normalizeItem({ title: 'Album', browseId: 'MPRE123' })!)).toBeNull()
  })

  it('builds a playable track and joins multiple artists', () => {
    const track = itemToTrack(
      normalizeItem({ ...song, artists: [{ name: 'A', id: 'UC1' }, { name: 'B', id: 'UC2' }] })!,
    )
    expect(track).toMatchObject({
      id: 'video-123',
      videoId: 'video-123',
      title: 'Yellow',
      artist: 'A, B',
      artistId: 'UC1',
      durationText: '4:29',
    })
  })

  it('falls back to the subtitle when no artists are listed', () => {
    const track = itemToTrack(normalizeItem({ title: 'X', videoId: 'v1', subtitle: 'Someone' })!)
    expect(track?.artist).toBe('Someone')
  })
})

describe('toTracks', () => {
  it('keeps only playable entries in order', () => {
    const tracks = toTracks([song, { title: 'Album', browseId: 'MPRE123' }, { title: 'B', videoId: 'v2' }])
    expect(tracks.map((t) => t.videoId)).toEqual(['video-123', 'v2'])
  })

  it('applies the fallback artist to artist-less tracks', () => {
    const tracks = toTracks([{ title: 'Solo', videoId: 'v3' }], 'Unknown Artist')
    expect(tracks[0].artist).toBe('Unknown Artist')
  })

  it('handles a missing list', () => {
    expect(toTracks(undefined)).toEqual([])
  })
})
