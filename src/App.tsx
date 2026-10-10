import { BrowserRouter, Route, Routes } from 'react-router-dom'

const baseUrl = import.meta.env.BASE_URL
const routerBasename = baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '')
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { SearchPage } from '@/pages/SearchPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { ChartsPage } from '@/pages/ChartsPage'
import { MoodsPage } from '@/pages/MoodsPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { LikedPage } from '@/pages/LikedPage'
import { RecentPage } from '@/pages/RecentPage'
import { PlaylistsPage } from '@/pages/PlaylistsPage'
import { PlaylistDetailPage } from '@/pages/PlaylistDetailPage'
import { ExternalPlaylistPage } from '@/pages/ExternalPlaylistPage'
import { AlbumPage } from '@/pages/AlbumPage'
import { ArtistPage } from '@/pages/ArtistPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/moods" element={<MoodsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/liked" element={<LikedPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
          <Route path="/playlist/:id" element={<ExternalPlaylistPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
