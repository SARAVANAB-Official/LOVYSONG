/**
 * Best-effort thumbnail upscaling.
 * YouTube Music returns small (w60-h60) square thumbnails; we bump the size
 * token when present. If the URL is not a recognizable Google user-content
 * image we return it untouched.
 */
export function hiRes(url: string | null | undefined, size = 544): string | undefined {
  if (!url) return undefined
  const replaced = url.replace(/=w\d+-h\d+/, `=w${size}-h${size}`)
  if (replaced !== url) return replaced
  const m = url.match(/\/vi\/([\w-]{11})\//)
  if (m && /default\.jpg|mqdefault\.jpg/.test(url)) {
    return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`
  }
  return url
}
