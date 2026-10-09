/** Format seconds as m:ss (or h:mm:ss for long content). */
export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
  const s = Math.floor(totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Parse "3:45" / "1:02:11" into seconds. Returns null when not parseable. */
export function parseDurationText(text: string | null | undefined): number | null {
  if (!text) return null
  const parts = text.split(':').map((p) => Number.parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

export function formatCount(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : value
  if (n == null || !Number.isFinite(n)) return ''
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
