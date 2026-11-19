'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { WORKS } from './data'

const OUT = [0.16, 1, 0.3, 1] as const
const TILT = ['-rotate-2', 'rotate-[1.5deg]', 'rotate-1', '-rotate-[1.5deg]']

export function WorkIndex() {
  const reduce = useReducedMotion()

  return (
    <section id="isler" aria-labelledby="isler-baslik" className="relative scroll-mt-8">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-16 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <h2 id="isler-baslik" className="font-anton relative w-fit text-[clamp(4rem,11vw,8rem)] uppercase leading-[0.85] text-[var(--fo-ink)]">
            İşler
            <svg viewBox="0 0 300 30" className="fo-draw absolute -bottom-4 left-0 w-full text-[var(--fo-hot)]" aria-hidden="true">
              <path d="M4 18 C80 6 160 26 296 10" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" pathLength={1} />
            </svg>
          </h2>
          <p className="font-hand max-w-xs -rotate-2 text-3xl leading-tight text-[var(--fo-ink)]/80">hâlâ gururla baktığım birkaç proje ↓</p>
        </div>

        <ul className="grid grid-cols-1 gap-x-10 gap-y-20 md:grid-cols-2">
          {WORKS.map((w, i) => (
            <motion.li
              key={w.title}
              initial={reduce ? false : { opacity: 0, y: 60, rotate: i % 2 ? 4 : -4 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, ease: OUT }}
              className={cn('group', i % 2 === 1 && 'md:mt-24')}
            >
              <article className="flex flex-col gap-5">
                <figure className={cn('relative bg-[var(--fo-paper)] p-3 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-0 group-hover:scale-[1.015]', TILT[i % TILT.length])}>
                  <span className="absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 rotate-[-3deg] bg-[var(--fo-ink)]/25 backdrop-blur-[2px]" aria-hidden="true" />
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={w.image || '/placeholder.svg'} alt={w.alt} fill sizes="(min-width: 768px) 46vw, 100vw" className="object-cover grayscale transition duration-1000 group-hover:scale-105 group-hover:grayscale-0" />
                  </div>
                </figure>
                <div className="flex items-start gap-4 px-1">
                  <span className="font-hand mt-1 text-4xl leading-none text-[var(--fo-hot)]">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="font-anton text-4xl uppercase leading-none tracking-wide text-[var(--fo-ink)]">{w.title}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fo-ink)]/55">
                      {w.kind} · {w.year}
                    </p>
                    <p className="max-w-md text-pretty leading-relaxed text-[var(--fo-ink)]/75">{w.summary}</p>
                    <p className="font-hand text-2xl text-[var(--fo-ink)]/80">rol: {w.role}</p>
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
