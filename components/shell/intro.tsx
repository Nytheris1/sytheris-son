'use client'

import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type Ref } from 'react'
import { Frame, Slit } from './intro-scenes/frame'
import { EnterButton, Tagline, Title } from './intro-scenes/reveal'
import { EXPO, OUT, TIMELINE, reached, type Phase } from './intro-scenes/shared'
import { Fracture, World, useCoverSet, type CoverSet, type Pointer } from './intro-scenes/world'

/*
 * SYTHERIS — "門" (The Gate)
 * Act I    The Signal   : a single slit of light in total darkness, framed by editorial print marks.
 * Act II   The Fracture : the slit tears open into shards — the same world seen through displaced realities.
 * Act III  The Reveal   : the shards lock together and the name heals out of two halves.
 * Act IV   Enter        : a gate-shaped call to action. Pressing it splits the screen down the original slit.
 */

type IntroProps = {
  covers: string[]
  enabled: boolean
  /** Ignores the "already seen" flag and never writes it. Used for replaying the intro on demand. */
  preview?: boolean
  onClose?: () => void
}

type ExitMode = 'none' | 'doors' | 'fade' | 'instant'

const ZERO_TC = '00:00:00:00'

function formatTimecode(ms: number) {
  const s = Math.floor(ms / 1000)
  const f = Math.floor(((ms % 1000) / 1000) * 24)
  return `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
}

export function Intro({ covers, enabled, preview = false, onClose }: IntroProps) {
  const [show, setShow] = useState(enabled)
  const [phase, setPhase] = useState<Phase>('signal')
  const [exitMode, setExitMode] = useState<ExitMode>('none')
  const [reduce, setReduce] = useState(false)
  const [shards, setShards] = useState(5)
  const [frozenTc, setFrozenTc] = useState(ZERO_TC)

  const rootRef = useRef<HTMLDivElement>(null)
  const enterRef = useRef<HTMLButtonElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const tcText = useRef(ZERO_TC)
  const finished = useRef(false)
  const leaving = useRef(false)
  const phaseRef = useRef<Phase>('signal')
  phaseRef.current = phase

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const pointer: Pointer = { x: useSpring(px, { stiffness: 50, damping: 18 }), y: useSpring(py, { stiffness: 50, damping: 18 }) }
  const set = useCoverSet(covers)

  const close = useCallback(() => {
    if (finished.current) return
    finished.current = true
    if (!preview) {
      try {
        sessionStorage.setItem('sy-intro-seen', '1')
      } catch {}
    }
    document.body.style.overflow = ''
    setShow(false)
  }, [preview])

  const skip = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    setExitMode('fade')
    close()
  }, [close])

  const enter = useCallback(() => {
    if (leaving.current) return
    if (reduce) {
      skip()
      return
    }
    leaving.current = true
    setFrozenTc(tcText.current)
    setExitMode('doors')
  }, [reduce, skip])

  useEffect(() => {
    const seen = !preview && document.documentElement.classList.contains('intro-seen')
    if (!enabled || seen) {
      setExitMode('instant')
      setShow(false)
      return
    }

    const prefersReduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')
    setReduce(prefersReduce)
    setShards(window.matchMedia('(min-width: 768px)').matches ? 5 : 3)
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus({ preventScroll: true })

    const timers: number[] = []
    if (prefersReduce) {
      setPhase('enter')
    } else {
      timers.push(window.setTimeout(() => setPhase('fracture'), TIMELINE.fracture))
      timers.push(window.setTimeout(() => setPhase('reveal'), TIMELINE.reveal))
      timers.push(window.setTimeout(() => setPhase('enter'), TIMELINE.enter))
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const text = formatTimecode(now - start)
      if (text !== tcText.current) {
        tcText.current = text
        if (tcRef.current) tcRef.current.textContent = text
      }
      if (now - start < 60000) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const fine = window.matchMedia('(pointer: fine)').matches
    const move = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    if (fine && !prefersReduce) window.addEventListener('pointermove', move, { passive: true })

    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        skip()
        return
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        if (phaseRef.current === 'enter') enter()
        else skip()
        return
      }
      if (e.key === 'Tab' && rootRef.current) {
        const focusable = Array.from(rootRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).filter((b) => !b.closest('[inert]'))
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === rootRef.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', keys)

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('keydown', keys)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, preview])

  useEffect(() => {
    if (phase !== 'enter') return
    const active = document.activeElement
    if (!active || active === document.body || active === rootRef.current) enterRef.current?.focus({ preventScroll: true })
  }, [phase])

  const splitting = exitMode === 'doors'

  return (
    <AnimatePresence onExitComplete={onClose}>
      {show && (
        <motion.div
          id="sy-intro"
          key="intro"
          ref={rootRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="SYTHERIS açılış animasyonu"
          className="dark fixed inset-0 z-[100] overflow-hidden text-on-scrim outline-none"
          exit={splitting || exitMode === 'instant' ? { opacity: splitting ? 1 : 0, transition: { duration: 0 } } : { opacity: 0, scale: 1.015, transition: { duration: reduce ? 0.25 : 0.45, ease: OUT } }}
          suppressHydrationWarning
        >
          <motion.div className="absolute inset-0" animate={{ opacity: splitting ? 0 : 1 }} transition={{ duration: 0, delay: splitting ? 0.32 : 0 }}>
            <Scene
              phase={phase}
              still={reduce}
              set={set}
              shards={shards}
              pointer={pointer}
              timecode={ZERO_TC}
              timecodeRef={tcRef}
              enterRef={enterRef}
              onEnter={enter}
              onSkip={skip}
            />
          </motion.div>

          {splitting && (
            <Doors onDone={close}>
              <Scene phase="enter" still set={set} shards={shards} pointer={pointer} timecode={frozenTc} onEnter={enter} onSkip={skip} />
            </Doors>
          )}

          <p className="sr-only" aria-live="polite">
            {phase === 'enter' ? 'SYTHERIS. Bir hikâye. Sonsuz evren. Evrene gir butonu hazır.' : ''}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type SceneProps = {
  phase: Phase
  still: boolean
  set: CoverSet
  shards: number
  pointer: Pointer
  timecode: string
  timecodeRef?: Ref<HTMLSpanElement>
  enterRef?: Ref<HTMLButtonElement>
  onEnter: () => void
  onSkip: () => void
}

function Scene({ phase, still, set, shards, pointer, timecode, timecodeRef, enterRef, onEnter, onSkip }: SceneProps) {
  const revealed = reached(phase, 'reveal')
  const fractured = reached(phase, 'fracture')

  return (
    <div className="absolute inset-0 bg-scrim">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={still ? false : { opacity: 1, scale: 1.12 }}
        animate={{ opacity: revealed ? 0.3 : 1, scale: revealed ? 1 : fractured ? 1.04 : 1.12 }}
        transition={still ? { duration: 0 } : { duration: revealed ? 1.2 : 2.6, ease: revealed ? EXPO : OUT }}
      >
        {!still && (phase === 'fracture' || phase === 'reveal') && <Fracture count={shards} phase={phase} set={set} pointer={pointer} />}
        {(still || phase === 'enter') && <World set={set} pointer={pointer} still={still} />}
      </motion.div>

      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,var(--scrim)_80%)]" />
      <div aria-hidden="true" className="grain absolute inset-0" />

      <Slit phase={phase} still={still} />

      {revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <Title still={still} />
          <Tagline still={still} />
          <div className="mt-10 flex h-14 items-center sm:mt-14 sm:h-16">
            {phase === 'enter' && <EnterButton ref={enterRef} still={still} onEnter={onEnter} />}
          </div>
        </div>
      )}

      <Frame phase={phase} still={still} timecode={timecode} timecodeRef={timecodeRef} onSkip={onSkip} />
    </div>
  )
}

/* The exit: the original slit reappears as a seam, then the frozen frame parts like sliding doors onto the home page. */
function Doors({ children, onDone }: { children: React.ReactNode; onDone: () => void }) {
  const door = { duration: 1.05, ease: EXPO, delay: 0.32 }
  return (
    <div className="absolute inset-0" aria-hidden="true" inert>
      <motion.div className="absolute inset-0 [clip-path:inset(0_50%_0_0)]" initial={{ x: '0%' }} animate={{ x: '-51%' }} transition={door}>
        <motion.div className="absolute inset-0" initial={{ x: '0%' }} animate={{ x: '10%' }} transition={door}>
          {children}
        </motion.div>
        <span className="absolute inset-y-0 left-[calc(50%-1px)] w-px bg-primary" />
      </motion.div>
      <motion.div
        className="absolute inset-0 [clip-path:inset(0_0_0_50%)]"
        initial={{ x: '0%' }}
        animate={{ x: '51%' }}
        transition={door}
        onAnimationComplete={onDone}
      >
        <motion.div className="absolute inset-0" initial={{ x: '0%' }} animate={{ x: '-10%' }} transition={door}>
          {children}
        </motion.div>
        <span className="absolute inset-y-0 left-1/2 w-px bg-primary" />
      </motion.div>
      <motion.span
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-on-scrim"
        initial={{ scaleY: 0, opacity: 1 }}
        animate={{ scaleY: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.6, ease: EXPO, opacity: { duration: 0.7, times: [0, 0.55, 1] } }}
      />
    </div>
  )
}
