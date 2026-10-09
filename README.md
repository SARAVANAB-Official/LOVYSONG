# SonicWave

A premium, Spotify-style music streaming client built on the [Verome API](../Verome-API-main) (Deno + YouTube Music). Real playback, real search, real discovery — no mock data.

## Stack

- **React 19 + TypeScript 6** (strict), **Vite 8**, **Tailwind CSS 3.4**
- **TanStack Query 5** for server state, **Zustand 5** for player/library/UI state
- **React Router 7**, **Framer Motion 13**, **lucide-react**
- **Vitest 4 + Testing Library** (unit), **Playwright 1.62** (e2e), **oxlint**

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 20+ | `node -v` |
| Deno | Runs the Verome API backend |
| Chrome (installed) | Playwright uses `channel: "chrome"` — no browser download |

## Getting started

```powershell
# 1. Start the Verome API (terminal A)
cd ..\Verome-API-main
deno task start            # http://localhost:8000

# 2. Start SonicWave (terminal B)
npm install
npm run dev                # http://localhost:5173
```

`.env` points at `http://localhost:8000` for local development; `.env.production` points at the deployed API.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript project build (no emit) |
| `npm run lint` | oxlint |
| `npm test` | Vitest unit tests (jsdom) |
| `npm run test:e2e` | Playwright e2e suite (starts the dev server on port **5273** automatically) |

> The e2e suite uses port **5273** on purpose: 5173 is frequently occupied by other Vite apps on this machine, and Playwright would silently test the wrong app.

## Architecture

```
src/
├── pages/           14 routes (home, search, explore, charts, moods, library,
│                    liked, recent, playlists + detail, album, artist, 404)
├── components/
│   ├── layout/      AppLayout, Sidebar, TopBar, RightPanel, MobileNav
│   ├── player/      PlayerBar, ProgressBar, QueuePanel, LyricsPanel, NowPlaying
│   ├── music/       TrackRow/TrackList, MediaCard, TrackMenu, AddToPlaylistModal
│   └── search/      SearchBar (debounced, suggestions, recent history)
├── services/
│   ├── playbackService.ts   dual-engine playback (singleton, lives outside React)
│   ├── veromeApi.ts         typed API client + response normalisation
│   └── apiClient.ts         fetch wrapper: timeout, retries, abort, CORS base URL
├── hooks/queries.ts         TanStack Query hooks (one per endpoint)
└── stores/                  playerStore, libraryStore (persisted), uiStore
```

### Playback engine (`services/playbackService.ts`)

1. **Direct audio** — `GET /api/stream` → streamed through `/api/proxy` (CORS-safe) into one `HTMLAudioElement`.
2. **YouTube IFrame fallback** — used automatically when no direct stream exists (the public Piped/Invidious mirrors behind `/api/stream` are currently offline, so this is the active path today).

The engine is a singleton keyed to `#sonicwave-yt-engine`, so playback never restarts on navigation or re-render. On a YouTube error it recovers in order: `fallbackVideoId` → client-side `yt_search` for an embeddable alternative → explicit error toast.

### API integration notes

- Backend health (`GET /health`) drives the TopBar **Connected / Offline** badge.
- The unfiltered `/api/search` returns only the *top hit*, so the **All** tab fans out to `filter=songs|artists|albums|playlists` and merges the results (`useSearchGroups`).
- Playlist search items arrive mislabelled `resultType: "album"`; normalisation keys off the `VL` / `MPRE` / `UC` browseId prefixes instead.
- `/api/moods/:categoryId` currently returns `[]`; the "similar tracks" rail uses `/api/related/:videoId` instead.
- Library data (likes, playlists, recents, search history) is persisted to `localStorage` — no accounts, no write endpoints.

## Testing

```powershell
npm test          # 64 unit tests — utils, API normalisation, stores, components
npm run test:e2e  # 20 e2e tests — requires the backend on :8000
```

### What is covered

| Layer | Coverage |
| --- | --- |
| Unit (Vitest) | `format`/`lrc`/`thumbnail` utils, `veromeApi` normalisation, `playerStore` + `libraryStore` logic, `TrackRow`, `SearchBar`, `NotFoundPage` |
| E2E (Playwright) | Home loads with live API data + health badge; search (results, filter tabs, history); **real playback** (track plays, YT engine attached, time advances, pause/resume); queue next-track + queue panel; like → Liked Songs (persisted); playlist create → add track via row menu → verify; recently-played history; charts/moods/genre discovery; all 8 section routes render; 404 page + recovery navigation |

### What is not covered

- **Direct-audio playback path** — unreachable while `/api/stream` returns 404; covered only by unit tests (`pickBestAudio`). Re-enable the e2e engine assertion if stream mirrors return.
- **Mobile viewport flows** — e2e runs at desktop (1280×720); `MobileNav`, bottom sheets, and compact player controls are exercised only by manual/responsive checks.
- **Lyrics panel** (external LRCLIB fetch), **Now Playing overlay**, **volume/shuffle/repeat/seek**, **album/artist detail pages**, **saved albums/artists**, **keyboard shortcuts** — implemented, but not covered by automated tests.
- **Production build e2e** — the suite runs against the Vite dev server; `npm run build` + `npm run preview` are verified separately via `npm run build`.
