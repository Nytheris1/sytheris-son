'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Burst, Corner, Crown, Kisses, Scribble, TextRing } from './doodles'
import { PROFILE } from './data'

const OUT = [0.16, 1, 0.3, 1] as const

export function PortfolioHero() {
  const reduce = useReducedMotion()
  const letters = PROFILE.hello.split('')

  return (
    <section aria-labelledby="fo-hello" className="relative mx-auto grid min-h-[100svh] w-full max-w-[1320px] items-center gap-14 px-5 pb-16 pt-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:px-12">
      <div className="relative mx-auto w-full max-w-[460px]">
        <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease: OUT }} className="font-hand absolute -top-14 left-[22%] z-20 -rotate-6 text-5xl text-[var(--fo-ink)] sm:text-6xl">
          Hakkımda
          <svg viewBox="0 0 200 20" className="fo-draw -mt-2 block w-40 text-[var(--fo-ink)]" aria-hidden="true">
            <path d="M4 12 C60 4 120 18 196 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength={1} />
          </svg>
        </motion.p>
        <Crown className="absolute -top-16 left-[6%] z-20 w-11 rotate-[-10deg] text-[var(--fo-ink)]" />
        <Kisses className="absolute -left-6 top-10 z-20 w-24 -rotate-12 text-[var(--fo-hot)]" />
        <TextRing words={PROFILE.ringWords} className="absolute -left-14 top-[30%] z-20 w-36 text-[var(--fo-ink)] sm:-left-20 sm:w-44" />
        <Scribble className="absolute -bottom-16 -right-10 z-0 w-56 rotate-12 text-[var(--fo-hot)] sm:-right-20 sm:w-64" />
        <Burst className="absolute -right-4 top-[38%] z-20 w-16 rotate-12 text-[var(--fo-ink)] sm:w-20" />

        <motion.figure
          initial={reduce ? false : { opacity: 0, rotate: 8, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, rotate: -5, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.15 }}
          whileHover={reduce ? undefined : { rotate: -2, scale: 1.02 }}
          className="relative z-10 bg-[var(--fo-paper)] p-3.5 pb-0 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
        >
          <div className="relative aspect-square overflow-hidden bg-[var(--fo-bg)]">
            <Image src={PROFILE.photo || '/placeholder.svg'} alt={PROFILE.photoAlt} fill priority sizes="(min-width: 1024px) 440px, 90vw" className="object-cover grayscale contrast-125" />
          </div>
          <figcaption className="font-hand flex items-end justify-between gap-4 px-1 pb-3 pt-2 text-3xl leading-none text-[var(--fo-bg)] sm:text-4xl">
            <span className="-rotate-3 underline decoration-2 underline-offset-4">{PROFILE.photoNoteLeft}</span>
            <span className="rotate-2 text-right text-2xl sm:text-3xl">{PROFILE.photoNoteRight}</span>
          </figcaption>
        </motion.figure>
      </div>

      <div className="relative flex flex-col gap-7 lg:pl-6">
        <h1 id="fo-hello" className="font-anton flex text-[clamp(5.5rem,16vw,11rem)] leading-[0.82] tracking-[-0.01em] text-[var(--fo-ink)]" aria-label={PROFILE.hello}>
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={reduce ? false : { opacity: 0, y: 60, rotate: i % 2 ? 8 : -8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.35 + i * 0.06 }}
              className={ch === '!' ? 'text-[var(--fo-hot)]' : undefined}
            >
              {ch}
            </motion.span>
          ))}
        </h1>
        <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease: OUT }} className="max-w-md text-pretty text-lg leading-relaxed text-[var(--fo-ink)]/85">
          {PROFILE.intro}
        </motion.p>
        <div className="flex flex-col gap-5">
          {PROFILE.statements.map((s, i) => (
            <motion.p
              key={s.lead}
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.9 + i * 0.12, ease: OUT }}
              className="max-w-md text-pretty leading-relaxed text-[var(--fo-ink)]/70"
              style={{ marginLeft: `${i * 2.5}rem` }}
            >
              <span className="font-anton mr-2 text-2xl uppercase tracking-wide text-[var(--fo-ink)]">{s.lead}</span>
              {s.text}
            </motion.p>
          ))}
        </div>
        <Corner className="absolute -bottom-6 right-0 hidden w-14 text-[var(--fo-ink)] lg:block" />
      </div>
    </section>
  )
}
