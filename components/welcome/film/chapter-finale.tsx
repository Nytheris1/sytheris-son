'use client'

import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react'
import { useSectionProgress } from '@/lib/use-section-progress'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const PANELS = 7

function Panel({ i, p, cover }: { i: number; p: MotionValue<number>; cover?: string }) {
  const start = 0.18 + (i % 2 ? 0.06 : 0) + Math.abs(i - (PANELS - 1) / 2) * 0.035
  const y = useTransform(p, [start, Math.min(0.92, start + 0.42)], [i % 2 ? '-101%' : '101%', '0%'])
  return (
    <motion.div style={{ y }} className="relative h-full flex-1 overflow-hidden border-x border-scrim/30 bg-primary">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover || '/placeholder.svg'} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-25 mix-blend-multiply grayscale" />
      )}
    </motion.div>
  )
}

/**
 * Finale — the curtain. Scrolling closes a row of shutters over the screen; once they meet,
 * the film hands over to the home page, which opens the same shutters on arrival.
 */
export function ChapterFinale({ covers, onEnter, signedIn }: { covers: string[]; onEnter: (href: string) => void; signedIn: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const fired = useRef(false)
  const scrollYProgress = useSectionProgress(ref, ['start start', 'end end'])
  const titleScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.82])
  const titleOpacity = useTransform(scrollYProgress, [0.55, 0.8], [1, 0])
  const logoOpacity = useTransform(scrollYProgress, [0.82, 0.95], [0, 1])
  const logoScale = useTransform(scrollYProgress, [0.82, 1], [1.25, 1])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v >= 0.995 && !fired.current) {
      fired.current = true
      onEnter('/')
    }
  })

  return (
    <section ref={ref} aria-labelledby="finale-title" className="relative h-[260vh] bg-scrim">
      <div className="dark sticky top-0 flex h-dvh items-center justify-center overflow-hidden text-on-scrim">
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />

        <motion.div style={{ scale: titleScale, opacity: titleOpacity }} className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
          <h2 id="finale-title" className="text-balance text-[clamp(56px,11vw,170px)] font-black uppercase leading-[0.82] tracking-[-0.06em]">
            Perde açılıyor.
          </h2>
          <p className="max-w-md text-pretty leading-relaxed text-on-scrim/65">Kaydırmaya devam et; perde kapandığında sayfa çevrilir. Ya da hemen gir.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onEnter('/')}
              className="group flex h-13 items-center gap-3 rounded-full bg-primary pl-6 pr-2 font-semibold text-primary-foreground shadow-[0_14px_44px_-14px_var(--primary)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-on-scrim"
            >
              Siteye gir
              <span className="grid size-9 place-items-center rounded-full bg-primary-foreground text-primary transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </button>
            {!signedIn && (
              <button type="button" onClick={() => onEnter('/giris')} className="flex h-13 items-center rounded-full border border-on-scrim/25 px-6 font-medium outline-none transition hover:bg-on-scrim/10 focus-visible:border-on-scrim">
                Hesap oluştur
              </button>
            )}
          </div>
        </motion.div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 flex">
          {Array.from({ length: PANELS }, (_, i) => (
            <Panel key={i} i={i} p={scrollYProgress} cover={covers[i]} />
          ))}
        </div>

        <motion.p
          aria-hidden="true"
          lang="en"
          style={{ opacity: logoOpacity, scale: logoScale }}
          className="pointer-events-none absolute z-30 text-[clamp(56px,12vw,190px)] font-black uppercase leading-none tracking-[-0.06em] text-primary-foreground"
        >
          Sytheris
        </motion.p>
      </div>
    </section>
  )
}
