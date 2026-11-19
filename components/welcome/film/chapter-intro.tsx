'use client'

import { motion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useSectionProgress } from '@/lib/use-section-progress'
import { useRef } from 'react'
import { MASCOT } from '@/components/mascot/mascot-config'

const OUT = [0.16, 1, 0.3, 1] as const

/** Simple red threads that tie Syra to the copy — drawn as the section scrolls past. */
const THREADS = [
  'M -40 180 C 220 120, 380 420, 640 300 S 1020 80, 1240 260 S 1500 520, 1700 380',
  'M -60 520 C 260 640, 420 260, 760 420 S 1080 700, 1320 480 S 1560 300, 1720 560',
  'M 120 900 C 340 700, 620 860, 860 640 S 1180 360, 1420 620 S 1620 860, 1760 720',
]

function Thread({ d, progress, delay }: { d: string; progress: MotionValue<number>; delay: number }) {
  const length = useTransform(progress, [delay, Math.min(1, delay + 0.55)], [0, 1])
  return <motion.path d={d} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" style={{ pathLength: length }} />
}

/**
 * Chapter 02 — Introduction, laid out like an official anime site's intro block:
 * a heading with a katakana tab, a vertical Japanese statement, copy and two outlined buttons,
 * with the guide character on the right and red threads running across the page.
 */
export function ChapterIntro({ onNavigate }: { onNavigate: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null)
  const scrollYProgress = useSectionProgress(ref, ['start end', 'end start'])
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 })
  const syraY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  return (
    <section ref={ref} id="tanitim" aria-labelledby="intro-title" className="relative isolate overflow-hidden bg-on-scrim py-24 text-scrim sm:py-32">
      <svg aria-hidden="true" viewBox="0 0 1700 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 size-full text-primary">
        {THREADS.map((d, i) => (
          <Thread key={i} d={d} progress={p} delay={0.08 + i * 0.1} />
        ))}
      </svg>

      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 px-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col gap-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.8, ease: OUT }} className="flex flex-col items-start gap-1.5">
            <h2 id="intro-title" lang="en" className="text-[clamp(40px,5vw,64px)] font-black uppercase leading-none tracking-[-0.02em]">
              Introduction
            </h2>
          </motion.div>

          <div className="flex gap-8 sm:gap-12">
            <div className="flex flex-col gap-6">
              {['Bir kapak,', 'bir kapı,', 'binlerce dünya.'].map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: OUT }}
                  className="text-[clamp(34px,4.4vw,60px)] font-bold leading-[1] tracking-[-0.04em]"
                >
                  {line}
                </motion.p>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.8, delay: 0.4, ease: OUT }}
                className="flex max-w-md flex-col gap-4 pt-2 text-pretty text-sm leading-relaxed text-scrim/70"
              >
                <p>
                  Sytheris, Türkiye’nin anime dergisi gibi düşünülmüş bir keşif platformu. Trendleri, sezonları ve bir sonraki favorini; seni yormadan, sinematik bir akışta önüne serer.
                </p>
                <p>Rastgele öneriden kütüphanene, yayın takviminden gece yarısı sinemasına — her sayfa, bir sonraki bölümü izleme isteğiyle tasarlandı.</p>
                <p className="font-semibold text-scrim">Peki sıradaki hikâye hangisi?</p>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => onNavigate('ozellikler')}
              className="flex h-14 min-w-44 items-center justify-center border-2 border-scrim px-8 font-mono text-xs font-bold uppercase tracking-[0.3em] outline-none transition hover:bg-scrim hover:text-on-scrim focus-visible:bg-scrim focus-visible:text-on-scrim"
            >
              Özellikler
            </button>
            <button
              type="button"
              onClick={() => onNavigate('karakter')}
              className="flex h-14 min-w-44 items-center justify-center border-2 border-scrim px-8 font-mono text-xs font-bold uppercase tracking-[0.3em] outline-none transition hover:bg-scrim hover:text-on-scrim focus-visible:bg-scrim focus-visible:text-on-scrim"
            >
              Rehber
            </button>
          </div>
        </div>

        {/* The in-view trigger lives on the unclipped wrapper: a child that starts fully clipped never registers as visible. */}
        <motion.div style={{ y: syraY }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.94, clipPath: 'inset(100% 0% 0% 0%)' },
              show: { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.3, ease: OUT } },
            }}
            className="relative size-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MASCOT.images.portrait} alt="Syra, Sytheris’in rehberi" className="size-full object-contain object-bottom drop-shadow-[0_30px_40px_rgb(0_0_0/0.18)]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
