'use client'

/*
 * SYTHERIS — "Bölüm 00 / Açılış" intro
 * Drop-in replacement for components/shell/intro.tsx.
 * Dependencies: motion, lucide-react (both already in the project).
 * Accent color follows the active site theme through var(--primary).
 */

import { ArrowRight, SkipForward } from 'lucide-react'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const RUNTIME = 9.4
const FPS = 24
const BAR = 0.2

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const EASE_CUT = [0.83, 0, 0.17, 1] as const

const CHAPTERS = [
  { at: 0, label: 'Soğuk Açılış', line: 'Her efsane, tek bir sahneyle başlar.' },
  { at: 1.9, label: 'Kapı', line: 'Binlerce dünya. Tek bir kapı.' },
  { at: 4.1, label: 'Başlık', line: 'Bir sonraki hikâyen burada başlıyor.' },
  { at: 6.6, label: 'Perde', line: 'Hazırsan, perde açılıyor.' },
] as const

const TITLE = 'SYTHERIS'.split('')

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

type Phase = 'play' | 'closing' | 'opening'

const pad = (n: number) => String(n).padStart(2, '0')
const toTimecode = (v: number) => `00:${pad(Math.floor(v))}:${pad(Math.floor((v % 1) * FPS))}`

function buildColumns(covers: string[], count: number, perColumn: number) {
  if (covers.length === 0) return []
  return Array.from({ length: count }, (_, c) =>
    Array.from({ length: perColumn }, (_, r) => covers[(c * perColumn + r * 3 + c) % covers.length]),
  )
}

export function Intro({
  covers,
  enabled,
  force = false,
  onDone,
}: {
  covers: string[]
  enabled: boolean
  force?: boolean
  onDone?: () => void
}) {
  const reduce = useReducedMotion() ?? false
  const [show, setShow] = useState(enabled || force)
  const [stage, setStage] = useState(0)
  const [phase, setPhase] = useState<Phase>('play')

  const clock = useMotionValue(0)
  const timecode = useTransform(clock, toTimecode)
  const progress = useTransform(clock, [0, RUNTIME], [0, 1])

  const finishing = useRef(false)
  const playback = useRef<AnimationPlaybackControls | null>(null)
  const timers = useRef<number[]>([])
  const onDoneRef = useRef(onDone)
  const reduceRef = useRef(reduce)

  useEffect(() => {
    onDoneRef.current = onDone
    reduceRef.current = reduce
  }, [onDone, reduce])

  const columns = useMemo(() => buildColumns(covers, 7, 6), [covers])

  const finish = useCallback(() => {
    if (finishing.current) return
    finishing.current = true
    playback.current?.stop()
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}

    const release = () => {
      document.body.style.overflow = ''
      setShow(false)
      onDoneRef.current?.()
    }

    if (reduceRef.current) {
      setPhase('opening')
      timers.current.push(window.setTimeout(release, 450))
      return
    }

    setPhase('closing')
    timers.current.push(
      window.setTimeout(() => setPhase('opening'), 560),
      window.setTimeout(release, 560 + 900),
    )
  }, [])

  useEffect(() => {
    const seen = document.documentElement.classList.contains('intro-seen')
    if (!force && (!enabled || seen)) {
      setShow(false)
      return
    }

    document.body.style.overflow = 'hidden'

    const unsubscribe = clock.on('change', (v) => {
      let index = 0
      for (let i = 0; i < CHAPTERS.length; i++) if (v >= CHAPTERS[i].at) index = i
      setStage(index)
    })

    playback.current = animate(clock, RUNTIME, {
      duration: RUNTIME,
      ease: 'linear',
      onComplete: finish,
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)

    const pending = timers.current
    return () => {
      unsubscribe()
      playback.current?.stop()
      pending.forEach((id) => window.clearTimeout(id))
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [clock, enabled, force, finish])

  const closing = phase !== 'play'
  const opened = phase === 'opening'

  const theme = {
    '--sy-ink': '#060607',
    '--sy-paper': '#f3f1ec',
  } as CSSProperties

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="sy-intro"
          key="sy-intro"
          role="dialog"
          aria-modal="true"
          aria-label="SYTHERIS açılış sahnesi"
          style={theme}
          className={`fixed inset-0 z-[100] overflow-hidden font-sans text-(--sy-paper) ${opened ? 'pointer-events-none' : ''}`}
          initial={false}
          animate={{ opacity: reduce && opened ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          suppressHydrationWarning
        >
          <p className="sr-only" aria-live="polite">
            {CHAPTERS[stage].line} Atlamak için Escape tuşuna basın.
          </p>

          {/* ---------- SCENE ---------- */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-(--sy-ink)"
            animate={{ opacity: opened ? 0 : 1 }}
            transition={{ duration: 0 }}
          >
            <CoverWall columns={columns} stage={stage} reduce={reduce} />

            <motion.div
              className="absolute left-1/2 top-0 h-full w-px origin-top bg-primary"
              style={{ boxShadow: '0 0 18px 1px var(--primary), 0 0 60px 4px var(--primary)' }}
              initial={{ scaleY: 0, opacity: 1 }}
              animate={stage === 0 ? { scaleY: 1, opacity: 1 } : { scaleY: 1, opacity: 0 }}
              transition={
                stage === 0
                  ? { scaleY: { duration: reduce ? 0.01 : 1.3, delay: 0.35, ease: EASE_OUT } }
                  : { opacity: { duration: 1.2, ease: EASE_CUT } }
              }
            />

            <motion.span
              lang="ja"
              className="absolute left-1/2 top-1/2 ml-6 -translate-y-1/2 text-xs tracking-[0.6em] text-(--sy-paper)/60 [writing-mode:vertical-rl] md:ml-10 md:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 0 ? 1 : 0 }}
              transition={{ duration: stage === 0 ? 1 : 0.5, delay: stage === 0 ? 1 : 0 }}
            >
              物語は、ここから始まる
            </motion.span>

            <TitleCard stage={stage} reduce={reduce} onEnter={finish} />

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay"
              style={{ backgroundImage: GRAIN }}
            />
          </motion.div>

          {/* ---------- SUBTITLE ---------- */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[calc(10vh+1.75rem)] flex justify-center px-6"
          >
            <AnimatePresence mode="wait">
              {!closing && (
                <motion.p
                  key={stage}
                  className="text-balance text-center text-base font-medium leading-relaxed text-(--sy-paper) md:text-xl"
                  style={{ textShadow: '0 1px 2px rgb(0 0 0 / 0.9), 0 0 24px rgb(0 0 0 / 0.6)' }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: stage === 0 ? 0.9 : 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  {CHAPTERS[stage].line}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ---------- LETTERBOX ---------- */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1/2 origin-top bg-(--sy-ink)"
            initial={{ scaleY: reduce ? BAR : 1 }}
            animate={{ scaleY: closing && !reduce ? 1 : BAR, y: opened && !reduce ? '-101%' : '0%' }}
            transition={{
              scaleY: { duration: closing ? 0.55 : 1.4, ease: EASE_IN_OUT, delay: closing ? 0 : 0.15 },
              y: { duration: 0.9, ease: EASE_IN_OUT },
            }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-(--sy-ink)"
            initial={{ scaleY: reduce ? BAR : 1 }}
            animate={{ scaleY: closing && !reduce ? 1 : BAR, y: opened && !reduce ? '101%' : '0%' }}
            transition={{
              scaleY: { duration: closing ? 0.55 : 1.4, ease: EASE_IN_OUT, delay: closing ? 0 : 0.15 },
              y: { duration: 0.9, ease: EASE_IN_OUT },
            }}
          />

          {/* ---------- SEAM (exit) ---------- */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary"
            style={{ boxShadow: '0 0 20px 2px var(--primary)' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              phase === 'closing' && !reduce
                ? { scaleX: 1, opacity: 1, transition: { duration: 0.45, delay: 0.2, ease: EASE_OUT } }
                : opened
                  ? { scaleX: 1, opacity: 0, transition: { duration: 0.5 } }
                  : { scaleX: 0, opacity: 0 }
            }
          />

          {/* ---------- PLAYER CHROME ---------- */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: closing ? 0.25 : 0.8, delay: closing ? 0 : 0.6 }}
          >
            <TopChrome />
            <BottomChrome stage={stage} timecode={timecode} progress={progress} onSkip={finish} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CoverWall({ columns, stage, reduce }: { columns: string[][]; stage: number; reduce: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ clipPath: 'inset(0% 50% 0% 50%)' }}
      animate={{ clipPath: stage >= 1 ? 'inset(0% 0% 0% 0%)' : 'inset(0% 50% 0% 50%)' }}
      transition={{ duration: reduce ? 0.01 : 1.7, ease: EASE_CUT }}
    >
      <div className="absolute inset-0 [perspective:1400px]">
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-[170vh] w-[175vw] gap-3 md:w-[150vw] md:gap-5"
          style={{ x: '-50%', y: '-50%', rotateX: 26, rotateZ: -12 }}
          initial={{ scale: reduce ? 1 : 1.28 }}
          animate={{ scale: stage >= 1 ? 1 : 1.28 }}
          transition={{ duration: reduce ? 0 : 9, ease: EASE_OUT }}
        >
          {columns.map((column, i) => {
            const down = i % 2 === 1
            return (
              <div key={i} className="relative flex-1 overflow-visible">
                <motion.div
                  className="flex flex-col gap-3 md:gap-5"
                  initial={{ y: down ? '-50%' : '0%' }}
                  animate={reduce ? undefined : { y: down ? '0%' : '-50%' }}
                  transition={{ duration: 70 + i * 6, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
                >
                  {[...column, ...column].map((src, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={j}
                      src={src || '/placeholder.svg'}
                      alt=""
                      draggable={false}
                      decoding="async"
                      className="aspect-[2/3] w-full rounded-md object-cover [filter:grayscale(1)_contrast(1.15)_brightness(0.75)]"
                    />
                  ))}
                </motion.div>
              </div>
            )
          })}
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-primary opacity-50 mix-blend-color" />
      <motion.div
        className="absolute inset-0 bg-(--sy-ink)"
        initial={{ opacity: 0.45 }}
        animate={{ opacity: stage >= 2 ? 0.68 : 0.45 }}
        transition={{ duration: 1.6, ease: EASE_OUT }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 50%, transparent 35%, rgb(6 6 7 / 0.92) 100%), linear-gradient(to top, rgb(6 6 7 / 0.9), transparent 35%)',
        }}
      />
    </motion.div>
  )
}

function TitleCard({ stage, reduce, onEnter }: { stage: number; reduce: boolean; onEnter: () => void }) {
  const visible = stage >= 2

  const word = {
    hidden: {},
    shown: { transition: { staggerChildren: reduce ? 0 : 0.075, delayChildren: 0.15 } },
  }
  const letter = {
    hidden: reduce ? { opacity: 0 } : { y: '112%' },
    shown: reduce
      ? { opacity: 1, transition: { duration: 0.6 } }
      : { y: '0%', transition: { duration: 1.15, ease: EASE_OUT } },
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-[6vh]">
      <motion.div
        className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-(--sy-paper)/70 md:mb-6 md:text-xs"
        initial={{ opacity: 0, y: 8 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: visible ? 0.9 : 0 }}
      >
        <span lang="ja" className="tracking-[0.2em] text-primary">
          第零話
        </span>
        <span className="h-px w-8 bg-(--sy-paper)/30" />
        <span>Bölüm 00 — Açılış</span>
      </motion.div>

      <div className="relative">
        <motion.h1
          className="flex text-[19vw] font-extrabold uppercase leading-[0.82] tracking-[-0.045em] md:text-[15.5vw]"
          variants={word}
          initial="hidden"
          animate={visible ? 'shown' : 'hidden'}
          aria-label="SYTHERIS"
        >
          {TITLE.map((char, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
              <motion.span className="inline-block" variants={letter}>
                {char}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex text-[19vw] font-extrabold uppercase leading-[0.82] tracking-[-0.045em] text-transparent md:text-[15.5vw]"
          style={{
            backgroundImage:
              'linear-gradient(105deg, transparent 42%, var(--primary) 49%, var(--sy-paper) 50%, var(--primary) 51%, transparent 58%)',
            backgroundSize: '260% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
          }}
          initial={{ backgroundPosition: '130% 0%' }}
          animate={visible && !reduce ? { backgroundPosition: '-30% 0%' } : { backgroundPosition: '130% 0%' }}
          transition={{ duration: visible ? 1.8 : 0, delay: visible ? 1.25 : 0, ease: EASE_IN_OUT }}
        >
          {TITLE.map((char, i) => (
            <span key={i} className="inline-block pb-[0.04em]">
              {char}
            </span>
          ))}
        </motion.div>

        <motion.span
          lang="ja"
          aria-hidden="true"
          className="absolute -right-3 top-[0.4em] text-[10px] font-medium tracking-[0.5em] text-primary [writing-mode:vertical-rl] md:-right-8 md:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 1, delay: visible ? 1.1 : 0 }}
        >
          シセリス
        </motion.span>

        <motion.div
          aria-hidden="true"
          className="mx-auto mt-3 h-px origin-left bg-primary md:mt-5"
          style={{ boxShadow: '0 0 12px var(--primary)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: visible ? 1 : 0 }}
          transition={{ duration: 1.4, delay: visible ? 1 : 0, ease: EASE_IN_OUT }}
        />
      </div>

      <AnimatePresence>
        {stage >= 3 && (
          <motion.button
            type="button"
            onClick={onEnter}
            className="group mt-8 inline-flex h-12 cursor-pointer items-center gap-3 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground outline-none transition-transform duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-(--sy-paper) focus-visible:ring-offset-2 focus-visible:ring-offset-(--sy-ink) md:mt-12 md:h-14 md:px-9 md:text-base"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            Keşfetmeye Başla
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function TopChrome() {
  return (
    <div className="absolute inset-x-0 top-0 flex h-[10vh] min-h-12 items-center justify-between border-b border-(--sy-paper)/10 px-5 font-mono text-[11px] uppercase tracking-[0.25em] text-(--sy-paper)/60 md:px-10">
      <span className="flex items-center gap-3">
        <motion.span
          className="size-1.5 rounded-full bg-primary"
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <span className="text-(--sy-paper)">Sytheris</span>
        <span className="hidden sm:inline">/ OP</span>
      </span>
      <span className="hidden md:inline">1080p · Türkçe Altyazı · 5.1</span>
      <span className="flex items-center gap-2">
        <kbd className="rounded border border-(--sy-paper)/25 px-1.5 py-0.5 font-mono text-[10px] text-(--sy-paper)/80">
          ESC
        </kbd>
        <span className="hidden sm:inline">ile atla</span>
      </span>
    </div>
  )
}

function BottomChrome({
  stage,
  timecode,
  progress,
  onSkip,
}: {
  stage: number
  timecode: MotionValue<string>
  progress: MotionValue<number>
  onSkip: () => void
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-[10vh] min-h-16 items-center gap-4 border-t border-(--sy-paper)/10 px-5 md:gap-8 md:px-10">
      <motion.span className="hidden w-[4.5rem] font-mono text-xs tabular-nums text-(--sy-paper) sm:block">
        {timecode}
      </motion.span>

      <div className="relative flex-1 pt-5">
        <div className="absolute inset-x-0 top-0 flex">
          {CHAPTERS.map((chapter, i) => (
            <span
              key={chapter.label}
              className={`absolute hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 md:block ${
                stage >= i ? 'text-(--sy-paper)' : 'text-(--sy-paper)/35'
              }`}
              style={{ left: `${(chapter.at / RUNTIME) * 100}%` }}
            >
              {chapter.label}
            </span>
          ))}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--sy-paper) md:hidden">
            {CHAPTERS[stage].label}
          </span>
        </div>

        <div className="relative h-0.5 overflow-hidden rounded-full bg-(--sy-paper)/15">
          <motion.div className="absolute inset-0 origin-left bg-primary" style={{ scaleX: progress }} />
        </div>
        {CHAPTERS.slice(1).map((chapter) => (
          <span
            key={chapter.label}
            aria-hidden="true"
            className="absolute bottom-[-3px] h-2 w-px bg-(--sy-paper)/50"
            style={{ left: `${(chapter.at / RUNTIME) * 100}%` }}
          />
        ))}
      </div>

      <span className="hidden font-mono text-xs tabular-nums text-(--sy-paper)/50 lg:block">
        {toTimecode(RUNTIME)}
      </span>

      <motion.button
        type="button"
        onClick={onSkip}
        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-(--sy-paper)/30 bg-(--sy-ink)/40 px-4 text-sm font-medium text-(--sy-paper) outline-none backdrop-blur-sm transition-colors duration-200 hover:border-(--sy-paper)/60 hover:bg-(--sy-paper)/10 focus-visible:ring-2 focus-visible:ring-primary md:px-5"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2, ease: EASE_OUT }}
      >
        İntroyu Atla
        <SkipForward className="size-4" aria-hidden="true" />
      </motion.button>
    </div>
  )
}
