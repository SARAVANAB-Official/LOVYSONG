import { useEffect, useState } from 'react'

/**
 * Best-effort dominant-color extraction from cover artwork.
 * Returns null when extraction isn't possible (CORS/opaque image); callers
 * must handle the null case and keep the interface usable without artwork.
 */
export function useArtworkColor(src: string | null | undefined): string | null {
  // Keep the source alongside the color so a stale artwork's color is never shown.
  const [resolved, setResolved] = useState<{ key: string; color: string | null } | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      if (cancelled) return
      try {
        const canvas = document.createElement('canvas')
        const size = 24
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 125) continue
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        if (!count) return
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        // Deepen the color so it reads well as a background wash.
        const scale = 0.55
        setResolved({ key: src, color: `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})` })
      } catch {
        setResolved({ key: src, color: null })
      }
    }
    img.onerror = () => setResolved({ key: src, color: null })
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  if (!src) return null
  return resolved && resolved.key === src ? resolved.color : null
}
