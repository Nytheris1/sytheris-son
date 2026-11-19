'use client'

import { useEffect, useState } from 'react'
import type { MediaCard } from '@/lib/anilist-types'
import { cn } from '@/lib/utils'

/**
 * Picks the sharpest landscape artwork available: the trailer's 1280x720 YouTube
 * thumbnail first, then the AniList banner, then a blurred cover as a last resort.
 */
export function backdropCandidates(media: MediaCard) {
  const list: { src: string; kind: 'yt' | 'banner' | 'cover' }[] = []
  if (media.trailer?.site === 'youtube' && media.trailer.id) list.push({ src: `https://i.ytimg.com/vi/${media.trailer.id}/maxresdefault.jpg`, kind: 'yt' })
  if (media.bannerImage) list.push({ src: media.bannerImage, kind: 'banner' })
  const cover = media.coverImage.extraLarge || media.coverImage.large
  if (cover) list.push({ src: cover, kind: 'cover' })
  return list
}

export function BackdropImage({ media, className, priority }: { media: MediaCard; className?: string; priority?: boolean }) {
  const candidates = backdropCandidates(media)
  const [i, setI] = useState(0)
  useEffect(() => setI(0), [media.id])
  const current = candidates[i]
  if (!current) return <div className={cn('absolute inset-0 bg-scrim', className)} />
  const isCover = current.kind === 'cover'
  return (
    <>
      {isCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.src || '/placeholder.svg'} alt="" aria-hidden="true" className={cn('absolute inset-0 size-full scale-110 object-cover blur-2xl', className)} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.src}
        src={current.src || '/placeholder.svg'}
        alt=""
        aria-hidden="true"
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={(e) => {
          if (current.kind === 'yt' && e.currentTarget.naturalWidth <= 320) setI((n) => n + 1)
        }}
        onError={() => setI((n) => n + 1)}
        className={cn('absolute inset-0 size-full', isCover ? 'object-contain object-right py-10' : 'object-cover', className)}
      />
    </>
  )
}
