'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Shuffle } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { pickTitle } from '@/lib/format'
import { StyledTitle } from '@/components/anime/styled-title'

export function LibraryHero({ banners, children }: { banners: MediaCard[]; children?: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const media = banners[index]

  useEffect(() => {
    if (banners.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000)
    return () => window.clearInterval(id)
  }, [banners.length])

  const shuffle = () => {
    if (banners.length < 2) return
    let n = index
    while (n === index) n = Math.floor(Math.random() * banners.length)
    setIndex(n)
  }

  return (
    <section className="dark relative isolate overflow-hidden bg-scrim text-foreground" aria-label="Kütüphane vitrini">
      <AnimatePresence initial={false}>
        {media && (
          <motion.div
            key={media.id}
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1 }, scale: { duration: 7, ease: 'linear' } }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.bannerImage || media.coverImage.extraLarge || '/placeholder.svg'} alt="" className="size-full object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-scrim/70 to-scrim/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-scrim/80 to-transparent" />
      <div className="grain absolute inset-0 -z-10" />

      <div className="mx-auto flex min-h-[420px] max-w-[1440px] flex-col justify-end gap-8 px-4 pb-10 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="label-mono flex items-center gap-3 text-primary">
              <span className="h-px w-10 bg-primary" /> Kütüphane
            </p>
            {media && (
              <AnimatePresence mode="wait">
                <motion.div key={media.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }}>
                  <StyledTitle title={pickTitle(media.title)} genres={media.genres} as="h2" className="text-4xl sm:text-5xl lg:text-6xl" />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={shuffle} aria-label="Rastgele vitrin" className="grid size-12 place-items-center rounded-full border border-foreground/25 backdrop-blur transition hover:rotate-180 hover:bg-foreground/10">
              <Shuffle className="size-4" />
            </button>
            {media && (
              <Link href={`/anime/${media.id}`} className="flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110">
                Detay <ArrowUpRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}
