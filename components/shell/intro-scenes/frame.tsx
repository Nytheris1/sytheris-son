'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { Ref } from 'react'
import { EXPO, OUT, PHASES, SCENES, jp, reached, type Phase } from './shared'

/* The light slit of Act I. It is the seed every later act grows out of. */
export function Slit({ phase, still }: { phase: Phase; still: boolean }) {
  if (still || reached(phase, 'reveal')) return null
  const open = reached(phase, 'fracture')
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <motion.div
        className="absolute h-[64vh] w-[3px] bg-primary/40"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 0.35, 0.35], opacity: open ? 0 : 1 }}
        transition={open ? { duration: 0.4, ease: OUT } : { duration: 1.5, ease: EXPO, delay: 0.15, times: [0, 0.7, 1] }}
      />
      <motion.div
        className="absolute h-[64vh] w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--on-scrim) 22%, var(--on-scrim) 78%, transparent)' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1, opacity: open ? 0 : 1 }}
        transition={open ? { duration: 0.6, ease: OUT, delay: 0.35 } : { duration: 1.2, ease: EXPO, delay: 0.15 }}
      />
      <motion.div
        className={`${jp.className} absolute flex w-full max-w-xs justify-between px-6 text-sm text-on-scrim/70 sm:max-w-sm`}
        initial={{ opacity: 0, letterSpacing: '0em' }}
        animate={{ opacity: open ? 0 : 1, letterSpacing: '0.4em' }}
        transition={{ duration: open ? 0.4 : 1.1, ease: OUT, delay: open ? 0 : 0.55 }}
      >
        <span>信</span>
        <span>号</span>
      </motion.div>
      <motion.p
        className="absolute top-[calc(50%+34vh)] font-mono text-[10px] uppercase tracking-[0.5em] text-on-scrim/60"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: open ? 0 : 1, y: 0 }}
        transition={{ duration: 0.6, ease: OUT, delay: open ? 0 : 0.8 }}
      >
        Sinyal alındı
      </motion.p>
    </div>
  )
}

const CORNERS = [
  'left-0 top-0 border-l border-t origin-top-left',
  'right-0 top-0 border-r border-t origin-top-right',
  'left-0 bottom-0 border-l border-b origin-bottom-left',
  'right-0 bottom-0 border-r border-b origin-bottom-right',
]

type FrameProps = {
  phase: Phase
  still: boolean
  timecode: string
  timecodeRef?: Ref<HTMLSpanElement>
  onSkip: () => void
}

/* Editorial print furniture: crop marks, folio, timecode, act index and vertical Japanese copy. */
export function Frame({ phase, still, timecode, timecodeRef, onSkip }: FrameProps) {
  const scene = SCENES[phase]
  const appear = (delay: number) => ({
    initial: still ? (false as const) : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: still ? { duration: 0.2 } : { duration: 0.8, ease: OUT, delay },
  })

  return (
    <div className="pointer-events-none absolute inset-0 px-[max(1rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:p-6 lg:p-8">
      <div className="relative h-full w-full">
        {CORNERS.map((c) => (
          <motion.span
            key={c}
            aria-hidden="true"
            className={`absolute size-3.5 border-on-scrim/50 sm:size-4 ${c}`}
            initial={still ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: EXPO, delay: 0.1 }}
          />
        ))}

        <div className="absolute inset-x-5 top-4 flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 sm:inset-x-7 sm:top-5 sm:text-[11px]">
          <motion.p {...appear(0.35)} className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-on-scrim">
              SYTHERIS <span className={`${jp.className} tracking-[0.2em] text-on-scrim/70`}>制作</span>
            </span>
            <span lang="en">
              No. 000 — <span className={`${jp.className} tracking-[0.2em]`}>序章</span>
            </span>
          </motion.p>
          <motion.p {...appear(0.45)} className="flex flex-col items-end gap-1 tabular-nums">
            <span className="text-on-scrim/60">TC</span>
            <span ref={timecodeRef} className="text-on-scrim" suppressHydrationWarning>
              {timecode}
            </span>
          </motion.p>
        </div>

        <motion.ol
          {...appear(0.6)}
          aria-label="Sahneler"
          className="absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col gap-5 font-mono text-[10px] uppercase tracking-[0.3em] lg:left-7 lg:flex"
        >
          {PHASES.map((p) => {
            const active = p === phase
            return (
              <li key={p} aria-current={active ? 'step' : undefined} className="flex items-center gap-3">
                <span className={`block h-px transition-all duration-500 ${active ? 'w-8 bg-primary' : 'w-3 bg-on-scrim/30'}`} />
                <span lang="en" className={`transition-colors duration-500 ${active ? 'text-on-scrim' : 'text-on-scrim/50'}`}>
                  {SCENES[p].title}
                </span>
              </li>
            )
          })}
        </motion.ol>

        <motion.p
          {...appear(0.7)}
          aria-hidden="true"
          className={`${jp.className} absolute right-5 top-1/2 hidden -translate-y-1/2 text-sm tracking-[0.5em] text-on-scrim/60 [writing-mode:vertical-rl] sm:block lg:right-7`}
        >
          物語は、ここから始まる。
        </motion.p>

        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-5">
          <div className="relative h-10 min-w-0 flex-1 overflow-hidden" aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p
                key={phase}
                initial={still ? false : { y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.6, ease: EXPO }}
                className="absolute bottom-0 left-0 flex items-baseline gap-3 whitespace-nowrap"
              >
                <span className={`${jp.className} text-lg text-on-scrim sm:text-xl`}>{scene.kanji}</span>
                <span lang="en" className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 sm:text-[11px]">
                  {scene.title}
                </span>
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.button
            {...appear(0.9)}
            type="button"
            onClick={onSkip}
            className="pointer-events-auto flex min-h-11 items-center gap-3 px-1 font-mono text-[11px] uppercase tracking-[0.3em] text-on-scrim/70 outline-none transition-colors hover:text-on-scrim focus-visible:text-on-scrim focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-scrim"
          >
            Atla
            <kbd className="border border-current/40 px-1.5 py-0.5 text-[9px] tracking-widest pointer-coarse:hidden">ESC</kbd>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
