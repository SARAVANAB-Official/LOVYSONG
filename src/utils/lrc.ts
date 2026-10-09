import type { LyricsLine } from '@/types/music'

const TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g

/**
 * Parse an LRC string into timestamped lines.
 * Multiple time tags on one line are supported.
 * Lines without a timestamp are kept with `time: null`.
 */
export function parseLrc(lrc: string): LyricsLine[] {
  const out: LyricsLine[] = []
  for (const rawLine of lrc.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(TIME_TAG)]
    const text = rawLine.replace(TIME_TAG, '').trim()

    if (matches.length === 0) {
      if (text) out.push({ time: null, text })
      continue
    }

    for (const m of matches) {
      const minutes = Number.parseInt(m[1], 10)
      const seconds = Number.parseInt(m[2], 10)
      const fracRaw = m[3] ?? '0'
      const fraction = Number.parseInt(fracRaw.padEnd(3, '0').slice(0, 3), 10) / 1000
      out.push({ time: minutes * 60 + seconds + fraction, text })
    }
  }
  return out.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity))
}

/** Convert plain (unsynced) lyrics into lines with null timestamps. */
export function parsePlain(plain: string): LyricsLine[] {
  return plain
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ time: null, text }))
}

/** Index of the line active at `currentTime`, or -1. Only meaningful for synced lyrics. */
export function activeLineIndex(lines: LyricsLine[], currentTime: number): number {
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].time
    if (t == null) continue
    if (t <= currentTime + 0.15) idx = i
    else break
  }
  return idx
}
