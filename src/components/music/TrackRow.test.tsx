import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TrackRow } from './TrackRow'
import { useLibraryStore } from '@/stores/libraryStore'
import type { Track } from '@/types/music'

const track: Track = {
  id: 'v1',
  videoId: 'v1',
  title: 'Yellow',
  artist: 'Coldplay',
  durationText: '4:29',
  thumbnail: 'https://example.com/art.jpg',
}

function renderRow(props: Partial<React.ComponentProps<typeof TrackRow>> = {}) {
  const onPlay = vi.fn()
  render(
    <MemoryRouter>
      <TrackRow track={track} index={0} active={false} playing={false} onPlay={onPlay} showArtwork={false} {...props} />
    </MemoryRouter>,
  )
  return { onPlay }
}

beforeEach(() => {
  useLibraryStore.setState({
    likedSongs: [],
    recentlyPlayed: [],
    playlists: [],
    searchHistory: [],
    savedAlbums: [],
    savedArtists: [],
  })
})

describe('TrackRow', () => {
  it('renders track metadata', () => {
    renderRow()
    expect(screen.getByText('Yellow')).toBeInTheDocument()
    expect(screen.getByText('Coldplay')).toBeInTheDocument()
    expect(screen.getByText('4:29')).toBeInTheDocument()
  })

  it('plays when the row is clicked via keyboard or index button', () => {
    const { onPlay } = renderRow()
    fireEvent.click(screen.getByLabelText('Play Yellow'))
    expect(onPlay).toHaveBeenCalledWith(0)

    const row = screen.getByText('Yellow').closest('[role="button"]') as HTMLElement
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onPlay).toHaveBeenCalledTimes(2)
  })

  it('double-clicking the row starts playback', () => {
    const { onPlay } = renderRow()
    const row = screen.getByText('Yellow').closest('[role="button"]') as HTMLElement
    fireEvent.doubleClick(row)
    expect(onPlay).toHaveBeenCalledWith(0)
  })

  it('likes and unlikes from the heart button', () => {
    renderRow()
    const heart = screen.getByLabelText('Save to Liked Songs')
    fireEvent.click(heart)
    expect(useLibraryStore.getState().likedSongs.map((t) => t.id)).toEqual(['v1'])
    expect(screen.getByLabelText('Remove from Liked Songs')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Remove from Liked Songs'))
    expect(useLibraryStore.getState().likedSongs).toEqual([])
  })

  it('marks the active row', () => {
    renderRow({ active: true, playing: true })
    expect(screen.getByText('Yellow')).toHaveClass('text-brand-400')
  })
})
