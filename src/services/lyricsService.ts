import { veromeApi } from './veromeApi'
import { parseLrc, parsePlain } from '@/utils/lrc'
import type { Lyrics } from '@/types/music'

/**
 * Fetch lyrics and parse them into display lines.
 * Prefers timestamped (LRC) lyrics, falling back to plain text.
 * Returns null when no lyrics are available (never fabricates content).
 */
export async function fetchLyrics(
  title: string,
  artist: string,
  duration?: number,
  signal?: AbortSignal,
): Promise<Lyrics | null> {
  const raw = await veromeApi.getLyrics(title, artist, duration, signal)
  if (!raw) return null

  if (raw.syncedRaw) {
    const lines = parseLrc(raw.syncedRaw).filter((l) => l.text.length > 0)
    if (lines.some((l) => l.time != null)) {
      return { ...raw, lines, synced: true }
    }
  }

  if (raw.plain) {
    const lines = parsePlain(raw.plain)
    if (lines.length) return { ...raw, lines, synced: false }
  }

  return raw.lines.length ? raw : null
}
