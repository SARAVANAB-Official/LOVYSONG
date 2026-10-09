import { useState } from 'react'
import { Music2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CoverProps {
  src?: string | null
  alt?: string
  className?: string
  rounded?: string
  iconClassName?: string
}

/** Artwork with a graceful placeholder when the image is missing or fails. */
export function Cover({ src, alt = '', className, rounded = 'rounded-lg', iconClassName }: CoverProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={cn('relative overflow-hidden bg-ink-700', rounded, className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-800">
          <Music2 className={cn('h-1/3 w-1/3 text-white/15', iconClassName)} />
        </div>
      )}
    </div>
  )
}
