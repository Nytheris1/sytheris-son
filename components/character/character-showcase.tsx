'use client'

import Link from 'next/link'
import { motion, useTransform } from 'motion/react'
import { useSectionProgress } from '@/lib/use-section-progress'
import { useRef } from 'react'
import { Heart } from 'lucide-react'
import { compact } from '@/lib/format'

const OUT = [0.16, 1, 0.3, 1] as const

export type ShowcaseArt = { src: string; transparent: boolean }

/**
 * Character key visual, modelled on an official character page:
 * outlined name echo across the top, name + signature on the left, the full-body artwork
 * standing in (and breaking out of) a slanted panel on the right, the series mark in the corner.
 */
export function CharacterShowcase({
  name,
  native,
  subtitle,
  bio,
  favourites,
  art,
  seriesTitle,
  seriesColor,
  primaryHref,
  primaryLabel = 'Animeyi izle',
  secondaryHref = '#kadro',
  secondaryLabel = 'Kadroyu gör',
  standee,
  sections,
}: {
  name: string
  native?: string | null
  subtitle: string
  bio: string
  favourites?: number | null
  art: ShowcaseArt | null
  seriesTitle?: string | null
  seriesColor?: string | null
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  /** Optional cut-out that stands in front of a photographic panel (e.g. a voice actor's best-known role). */
  standee?: (ShowcaseArt & { label: string }) | null
  sections: { id: string; label: string }[]
}) {
  const ref = useRef<HTMLElement>(null)
  const scrollYProgress = useSectionProgress(ref, ['start start', 'end start'])
  const echoX = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const panelY = useTransform(scrollYProgress, [0, 1], ['0%', '4%'])

  const words = name.trim().split(/\s+/)
  const first = words[0]
  const echo = (words.length > 1 ? words[words.length - 1] : first).toUpperCase()
  const tone = seriesColor || 'var(--primary)'
  const seriesWords = (seriesTitle ?? '').split(':')[0].toUpperCase().split(/\s+/).filter(Boolean)
  const seriesLines = seriesWords.length > 2 ? [seriesWords.slice(0, Math.ceil(seriesWords.length / 2)).join(' '), seriesWords.slice(Math.ceil(seriesWords.length / 2)).join(' ')] : seriesWords

  return (
    <section
      ref={ref}
      id="karakter-ust"
      aria-labelledby="character-name"
      className="relative isolate overflow-clip border-b border-border bg-background"
      style={{ ['--tone' as string]: tone }}
    >
      <motion.p
        aria-hidden="true"
        style={{ x: echoX }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
        className="char-echo pointer-events-none absolute -left-[2vw] top-[4%] -z-10 select-none whitespace-nowrap text-[clamp(120px,24vw,400px)] font-black leading-none tracking-[-0.05em]"
      >
        {echo}
      </motion.p>

      <div className="mx-auto grid w-full max-w-[1440px] lg:min-h-[min(860px,calc(100dvh-4rem))] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Copy */}
        <div className="relative z-10 order-2 flex flex-col justify-center gap-6 px-5 pb-14 pt-10 sm:px-8 lg:order-1 lg:py-20 lg:pl-12 lg:pr-0">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }} className="flex flex-col gap-6">
            <motion.h1
              id="character-name"
              lang="en"
              variants={rise}
              className="text-balance text-[clamp(52px,7.4vw,118px)] font-black uppercase leading-[0.84] tracking-[-0.045em]"
            >
              {name}
            </motion.h1>

            <motion.p variants={rise} className="text-pretty text-base font-bold sm:text-lg">
              {subtitle}
            </motion.p>

            {bio && (
              <motion.p variants={rise} className="line-clamp-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                {bio}
              </motion.p>
            )}

            <motion.p variants={rise} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Heart className="size-3.5 fill-[var(--tone)] text-[var(--tone)]" aria-hidden="true" />
                {compact(favourites ?? 0)} favori
              </span>
              {native && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-foreground/25" />
                  <span lang="ja" className="font-jp tracking-[0.12em] text-muted-foreground">
                    {native}
                  </span>
                </>
              )}
            </motion.p>

            <motion.div variants={rise} aria-hidden="true" className="relative flex w-fit items-end gap-2 pt-2">
              <span className="char-signature font-serif text-[clamp(56px,6vw,88px)] italic leading-[0.8]">{first}</span>
              <motion.span
                className="mb-2 h-[2px] w-24 origin-left -rotate-[8deg] bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.9, ease: OUT }}
              />
            </motion.div>

            <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
              {primaryHref && (
                <Link href={primaryHref} className="flex h-10 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-85">
                  {primaryLabel}
                </Link>
              )}
              <a href={secondaryHref} className="flex h-10 items-center rounded-full border-2 border-foreground px-6 text-sm font-semibold transition hover:bg-foreground hover:text-background">
                {secondaryLabel}
              </a>
            </motion.div>
          </motion.div>

          <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-[var(--tone)]" aria-hidden="true" />
            Sytheris karakter dosyası
          </p>
        </div>

        {/* Key visual */}
        <div className="relative order-1 h-[62svh] min-h-[440px] lg:order-2 lg:h-auto">
          <motion.div
            aria-hidden="true"
            style={{ y: panelY }}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: OUT }}
            className="char-panel absolute inset-y-[6%] left-[8%] right-[2%] overflow-hidden lg:inset-y-[7%] lg:left-[6%]"
          >
            <div className="absolute inset-0 bg-[var(--tone)]" />
            {art && !art.transparent && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art.src || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover object-top" />
            )}
            {art?.transparent && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art.src || '/placeholder.svg'} alt="" className="absolute inset-0 size-full scale-150 object-cover opacity-40 mix-blend-multiply blur-2xl" />
            )}
            <div className="halftone-lg absolute inset-0 text-foreground/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
          </motion.div>

          {/* Pinstripes: same box size as the panel, shifted left, clipped to its edge — so they run exactly parallel. */}
          <motion.div aria-hidden="true" style={{ y: panelY }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="pointer-events-none absolute inset-0">
            <div className="char-stripe absolute inset-y-[6%] left-[3%] right-[7%] lg:inset-y-[7%] lg:left-[1%] lg:right-[7%]" />
            <div className="char-stripe absolute inset-y-[6%] left-[5%] right-[5%] opacity-60 lg:inset-y-[7%] lg:left-[3%] lg:right-[5%]" />
          </motion.div>

          <span
            aria-hidden="true"
            className="absolute bottom-[12%] left-[13%] z-20 hidden origin-bottom-left -rotate-[71deg] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/60 sm:block lg:left-[11%]"
          >
            {name} · {seriesTitle ?? 'Sytheris'}
          </span>

          {art?.transparent && (
            <motion.div style={{ y: artY }} className="absolute inset-x-[6%] bottom-0 top-0 z-10 flex items-end justify-center">
              <motion.img
                src={art.src}
                alt={`${name}, tam boy`}
                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2, ease: OUT }}
                className="h-[104%] w-auto max-w-none select-none object-contain object-bottom drop-shadow-[0_40px_50px_rgb(0_0_0/0.35)]"
                draggable={false}
                fetchPriority="high"
              />
            </motion.div>
          )}
          {!art?.transparent && art && <span className="sr-only">{standee ? `${name} fotoğrafı` : `${name}, tam boy çizim`}</span>}

          {standee && !art?.transparent && (
            <motion.figure style={{ y: artY }} className="absolute bottom-0 left-0 z-10 flex h-[78%] w-[52%] flex-col items-start justify-end">
              <motion.img
                src={standee.src}
                alt={standee.label}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.1, delay: 0.45, ease: OUT }}
                className={
                  standee.transparent
                    ? 'h-full w-auto max-w-none select-none object-contain object-bottom drop-shadow-[0_30px_40px_rgb(0_0_0/0.4)]'
                    : 'h-[78%] w-auto max-w-full rotate-[-4deg] select-none border-[6px] border-background object-cover shadow-2xl'
                }
                draggable={false}
              />
              <figcaption lang="en" className="mb-4 ml-4 mt-2 bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-background">{standee.label}</figcaption>
            </motion.figure>
          )}

          {seriesLines.length > 0 && (
            <motion.p
              aria-hidden="true"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: OUT }}
              lang="en"
              className="char-series absolute bottom-[9%] right-[7%] z-20 max-w-[60%] text-right text-[clamp(22px,2.6vw,40px)] font-black uppercase leading-[0.86] tracking-[-0.03em]"
            >
              {seriesLines.map((l, i) => (
                <span key={i} className="block truncate">
                  {l}
                </span>
              ))}
            </motion.p>
          )}

          <nav aria-label="Sayfa bölümleri" className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex lg:right-5">
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="group relative grid size-5 place-items-center" aria-label={s.label}>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {s.label}
                </span>
                <span className={i === 0 ? 'size-2.5 rounded-full bg-foreground' : 'size-2.5 rounded-full border-2 border-foreground transition group-hover:bg-foreground'} />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: OUT } },
}
