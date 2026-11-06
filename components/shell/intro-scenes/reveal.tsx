'use client'

import { motion } from 'motion/react'
import type { Ref } from 'react'
import { EXPO, OUT, jp } from './shared'

const LETTERS = 'SYTHERIS'.split('')
const TAGLINE = ['Bir hikâye.', 'Sonsuz evren.']

/* Every glyph arrives as two halves from opposite sides — the fracture of Act II healing into the name. */
export function Title({ still }: { still: boolean }) {
  return (
    <h1 aria-label="SYTHERIS" className="relative select-none font-sans text-[clamp(3.25rem,19vw,15rem)] sm:text-[clamp(3.25rem,17vw,15rem)] font-bold leading-[0.82] tracking-[-0.045em] text-on-scrim">
      <span className="flex" aria-hidden="true">
        {LETTERS.map((l, i) => {
          const t = { duration: 1.1, ease: EXPO, delay: 0.1 + i * 0.06 }
          return (
            <span key={i} className="relative inline-block">
              <motion.span
                className="block [clip-path:inset(0_0_49%_0)]"
                initial={still ? false : { x: '-0.6em', opacity: 0 }}
                animate={{ x: '0em', opacity: 1 }}
                transition={t}
              >
                {l}
              </motion.span>
              <motion.span
                className="absolute inset-0 block [clip-path:inset(50%_0_0_0)]"
                initial={still ? false : { x: '0.6em', opacity: 0 }}
                animate={{ x: '0em', opacity: 1 }}
                transition={t}
              >
                {l}
              </motion.span>
            </span>
          )
        })}
      </span>

      {!still && (
        <motion.span
          aria-hidden="true"
          className="absolute -inset-x-[8vw] top-1/2 h-px origin-left bg-primary"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 1.5, times: [0, 0.55, 1], ease: EXPO }}
        />
      )}

      <motion.span
        aria-hidden="true"
        className={`${jp.className} absolute -right-1 -top-3 flex size-9 items-center justify-center bg-primary text-lg font-semibold leading-none tracking-normal text-primary-foreground sm:-right-3 sm:-top-5 sm:size-12 sm:text-2xl lg:size-14 lg:text-3xl`}
        initial={still ? false : { scale: 1.8, opacity: 0, rotate: -16 }}
        animate={{ scale: 1, opacity: 1, rotate: -4 }}
        transition={{ duration: 0.45, ease: OUT, delay: 1.05 }}
      >
        門
      </motion.span>
    </h1>
  )
}

export function Tagline({ still }: { still: boolean }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 sm:mt-9">
      <p className="mr-[-0.42em] flex flex-wrap justify-center gap-x-[1.1em] font-mono text-xs uppercase leading-relaxed tracking-[0.42em] text-on-scrim/90 sm:text-sm">
        {TAGLINE.map((w, i) => (
          <span key={w} className="inline-block overflow-hidden py-0.5">
            <motion.span
              className="inline-block"
              initial={still ? false : { y: '115%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, ease: EXPO, delay: 0.75 + i * 0.14 }}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </p>
      <motion.p
        lang="ja"
        className={`${jp.className} mr-[-0.35em] text-xs tracking-[0.35em] text-on-scrim/60`}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: OUT, delay: 1.2 }}
      >
        一つの物語、無限の宇宙。
      </motion.p>
    </div>
  )
}

/* A ticket-stub gate. The primary fill closes from the centre outward on hover — a preview of the split that follows the press. */
export function EnterButton({ still, onEnter, ref }: { still: boolean; onEnter: () => void; ref?: Ref<HTMLButtonElement> }) {
  return (
    <motion.div
      className="relative"
      initial={still ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: OUT, delay: 0.1 }}
    >
      {['-left-1.5 -top-1.5 border-l border-t', '-right-1.5 -top-1.5 border-r border-t', '-left-1.5 -bottom-1.5 border-l border-b', '-right-1.5 -bottom-1.5 border-r border-b'].map((c) => (
        <span key={c} aria-hidden="true" className={`absolute size-2 border-primary ${c}`} />
      ))}
      <button
        ref={ref}
        type="button"
        onClick={onEnter}
        className="group relative flex h-14 items-stretch overflow-hidden border border-on-scrim/30 bg-scrim/40 font-mono text-xs uppercase tracking-[0.4em] text-on-scrim outline-none backdrop-blur-sm transition-[border-color,transform] duration-300 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-scrim active:scale-[0.98] sm:h-16 sm:text-sm"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-center scale-x-0 bg-primary transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-100 group-active:scale-x-100"
        />
        <span
          aria-hidden="true"
          className={`${jp.className} relative flex w-14 items-center justify-center border-r border-on-scrim/30 text-lg tracking-normal text-primary transition-colors duration-300 group-hover:border-primary-foreground/30 group-hover:text-primary-foreground group-active:text-primary-foreground sm:w-16 sm:text-xl`}
        >
          入
        </span>
        <span className="relative flex items-center gap-5 pl-6 pr-6 transition-colors duration-300 group-hover:text-primary-foreground group-active:text-primary-foreground sm:pl-8">
          <span className="mr-[-0.4em]">Evrene gir</span>
          <span aria-hidden="true" className="relative flex h-px w-8 items-center">
            <span className="absolute inset-0 origin-left bg-current transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-x-125" />
            <span className="absolute -right-0.5 size-1.5 rotate-45 border-r border-t border-current transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:translate-x-2" />
          </span>
        </span>
      </button>
    </motion.div>
  )
}
