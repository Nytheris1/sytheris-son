'use client'

/**
 * SYTHERIS — Sinematik Açılış v5 "物語 / Uyanış"
 *
 * Drop-in replacement for components/shell/intro.tsx.
 * Same props (covers, enabled), same `#sy-intro` id and `sy-intro-seen`
 * session key, so the existing BOOT_SCRIPT + `.intro-seen #sy-intro` CSS keep working.
 * Accent follows the active site theme through `var(--primary)`.
 */

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from 'react'
import { preload } from 'react-dom'
import { ArrowRight } from 'lucide-react'

type Phase = 'boot' | 'kanji' | 'warp' | 'title' | 'ready' | 'exit'

type IntroProps = {
  covers: string[]
  enabled: boolean
  /** Ignore the session/preference check and always play (useful for previews). */
  force?: boolean
  onFinish?: () => void
}

const T = { kanji: 0.7, warp: 2.6, title: 4.4, ready: 6.5, auto: 12 }
const EXIT_MS = 1250
const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const LOGO = 'SYTHERIS'.split('')
/** Diagonal "katana" cut: y-percent at the left and right screen edges. */
const CUT = { left: 66, right: 34 }

const VARS = {
  '--sy-void': '#060509',
  '--sy-bone': '#f3efe8',
  '--sy-cyan': '#3ee0ff',
  '--sy-accent': 'var(--primary, #e11d48)',
  '--sy-bar': 'max(3rem, 9vh)',
} as CSSProperties

const ACTS: Record<Phase, string> = {
  boot: '00 · 起動 · Başlatılıyor',
  kanji: 'I · 物語 · Hikâye',
  warp: 'II · 跳躍 · Sıçrama',
  title: 'III · 覚醒 · Uyanış',
  ready: 'III · 覚醒 · Uyanış',
  exit: 'Fin · 開幕 · Perde',
}

const SUBTITLES: Partial<Record<Phase, string>> = {
  kanji: '« Her efsane, tek bir kareyle başlar. »',
  warp: '« Binlerce dünya. Tek bir kapı. »',
}

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const KEYFRAMES = `
@keyframes sy-grain{0%,100%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-5%)}60%{transform:translate(-2%,6%)}80%{transform:translate(5%,-2%)}}
@keyframes sy-rec{0%,100%{opacity:1}50%{opacity:.15}}
@media (prefers-reduced-motion: reduce){#sy-intro *{animation:none!important}}
`

export function Intro({ covers, enabled, force = false, onFinish }: IntroProps) {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<Phase>('boot')
  const [reduced, setReduced] = useState(false)
  const [fastExit, setFastExit] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const intensity = useRef(0)
  const phaseRef = useRef<Phase>('boot')
  const finishing = useRef(false)
  const timers = useRef<number[]>([])
  const finishRef = useRef<() => void>(() => {})

  for (const src of covers.slice(0, 18)) preload(src, { as: 'image' })

  finishRef.current = () => {
    if (finishing.current) return
    finishing.current = true
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    const early = phaseRef.current === 'boot' || phaseRef.current === 'kanji' || phaseRef.current === 'warp'
    if (early) setFastExit(true)
    phaseRef.current = 'exit'
    setPhase('exit')
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    timers.current.push(
      window.setTimeout(
        () => {
          document.body.style.overflow = ''
          setShow(false)
          onFinish?.()
        },
        isReduced ? 400 : EXIT_MS,
      ),
    )
  }

  useEffect(() => {
    const seen = document.documentElement.classList.contains('intro-seen')
    if (!force && (!enabled || seen)) {
      setShow(false)
      return
    }

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(isReduced)
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus({ preventScroll: true })

    const go = (p: Phase) => {
      if (finishing.current || phaseRef.current === p) return
      phaseRef.current = p
      setPhase(p)
    }
    if (isReduced) go('ready')

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000

      if (!isReduced) {
        if (t >= T.ready) go('ready')
        else if (t >= T.title) go('title')
        else if (t >= T.warp) go('warp')
        else if (t >= T.kanji) go('kanji')

        intensity.current =
          t < T.kanji
            ? 0
            : t < T.warp
              ? 0.1 + ((t - T.kanji) / (T.warp - T.kanji)) * 0.15
              : t < T.title
                ? Math.min(1, 0.35 + ((t - T.warp) / (T.title - T.warp - 0.3)) * 0.65)
                : 0
      }

      const p = isReduced ? 1 : Math.min(1, t / T.ready)
      const pct = Math.round(p * 100)
      if (pctRef.current) pctRef.current.textContent = String(pct).padStart(3, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
      if (progressRef.current) progressRef.current.setAttribute('aria-valuenow', String(pct))
      if (tcRef.current) {
        const frames = Math.floor(t * 24)
        const ff = String(frames % 24).padStart(2, '0')
        const ss = String(Math.floor(t) % 60).padStart(2, '0')
        const mm = String(Math.floor(t / 60)).padStart(2, '0')
        tcRef.current.textContent = `00:${mm}:${ss}:${ff}`
      }

      if (t >= T.auto) {
        finishRef.current()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finishRef.current()
      }
    }
    window.addEventListener('keydown', onKey)

    const pending = timers.current
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      pending.forEach((id) => window.clearTimeout(id))
      document.body.style.overflow = ''
    }
  }, [enabled, force])

  useEffect(() => {
    if (phase === 'ready') ctaRef.current?.focus({ preventScroll: true })
  }, [phase])

  const early = phase === 'boot' || phase === 'kanji' || phase === 'warp'
  const exiting = phase === 'exit'
  const animateIn = !reduced && !fastExit

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="sy-intro"
          key="sy-intro"
          ref={rootRef}
          role="dialog"
          aria-modal="true"
          aria-label="SYTHERIS açılış animasyonu"
          tabIndex={-1}
          className="dark fixed inset-0 z-[100] overflow-hidden font-sans text-[var(--sy-bone)] outline-none"
          style={VARS}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          suppressHydrationWarning
        >
          <style>{KEYFRAMES}</style>
          <h2 className="sr-only">SYTHERIS — Anime Keşif Platformu</h2>

          <motion.div
            className="absolute inset-0"
            animate={
              phase === 'title' && animateIn
                ? { x: [0, -14, 10, -6, 3, 0], y: [0, 8, -7, 4, -2, 0] }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {early && !exiting && <Stage phase={phase} covers={covers} intensity={intensity} />}

            {(phase === 'title' || phase === 'ready' || exiting) && (
              <>
                <FinalHalf side="top" phase={phase} cover={covers[0]} animateIn={animateIn} reduced={reduced} />
                <FinalHalf side="bottom" phase={phase} cover={covers[0]} animateIn={animateIn} reduced={reduced} />
                <Slash phase={phase} animateIn={animateIn} reduced={reduced} />
              </>
            )}

            {phase === 'title' && animateIn && <ImpactFrame />}
          </motion.div>

          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div
                key="cta"
                className="absolute inset-x-0 bottom-[calc(var(--sy-bar)+1.5rem)] z-30 flex flex-col items-center gap-4 px-6 sm:bottom-[calc(var(--sy-bar)+3rem)]"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 16, transition: { duration: 0.25 } }}
                variants={{ show: { transition: { staggerChildren: 0.09 } } }}
              >
                <motion.p
                  variants={RISE}
                  className="max-w-md text-pretty text-center text-base leading-relaxed text-[var(--sy-bone)]/75 sm:text-lg"
                >
                  Bir sonraki hikâyen, tek bir karede başlıyor.
                </motion.p>
                <motion.button
                  variants={RISE}
                  ref={ctaRef}
                  type="button"
                  onClick={() => finishRef.current()}
                  className="group relative inline-flex h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sy-bone)] sm:h-14 sm:px-9 sm:text-base"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-[var(--sy-bone)]/30 transition-transform duration-700 group-hover:translate-x-[420%]"
                  />
                  <span className="relative">Keşfetmeye Başla</span>
                  <ArrowRight className="relative size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </motion.button>
                <motion.span
                  variants={RISE}
                  className="font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--sy-bone)]/45"
                >
                  Enter ile devam et
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          <Letterbox
            phase={phase}
            reduced={reduced}
            tcRef={tcRef}
            pctRef={pctRef}
            barRef={barRef}
            progressRef={progressRef}
            onSkip={() => finishRef.current()}
          />

          <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
            <div
              className="absolute -inset-1/2 opacity-[0.13] mix-blend-overlay"
              style={{ backgroundImage: NOISE, animation: 'sy-grain 0.9s steps(6) infinite' }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--sy-void)_120%)]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const RISE = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
}

/* ───────────────────────── Act 0–II : the stage ───────────────────────── */

function Stage({ phase, covers, intensity }: { phase: Phase; covers: string[]; intensity: MutableRefObject<number> }) {
  const subtitle = SUBTITLES[phase]
  return (
    <div className="absolute inset-0 bg-[var(--sy-void)]">
      <SpeedLines intensity={intensity} />

      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px origin-center bg-[var(--sy-bone)]"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.55, 1], ease: EASE_IN_OUT }}
      />
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-[calc(50%+1.25rem)] -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.6em] text-[var(--sy-bone)]/55"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.4, 1] }}
      >
        起動
      </motion.span>

      {(phase === 'kanji' || phase === 'warp') && <KanjiAct leaving={phase === 'warp'} />}
      {phase === 'warp' && <Tunnel covers={covers} />}

      <AnimatePresence mode="wait">
        {subtitle && <Subtitle key={subtitle} text={subtitle} />}
      </AnimatePresence>
    </div>
  )
}

function SpeedLines({ intensity }: { intensity: MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0
    let h = 0
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const css = getComputedStyle(canvas)
    const bone = css.getPropertyValue('--sy-bone').trim() || '#f3efe8'
    const accent = css.getPropertyValue('--sy-accent').trim() || '#e11d48'

    let raf = 0
    let frame = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      // Animate "on twos" (12fps) like hand-drawn anime speed lines.
      if (frame++ % 2) return
      ctx.clearRect(0, 0, w, h)
      const k = intensity.current
      if (k < 0.01) return

      const cx = w / 2
      const cy = h / 2
      const R = Math.hypot(cx, cy) * 1.1
      const count = Math.floor(30 + 190 * k)
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2
        const inner = R * (0.72 - 0.45 * k + Math.random() * 0.28)
        const spread = 0.0015 + Math.random() * 0.011 * k
        ctx.globalAlpha = 0.08 + Math.random() * 0.6 * k
        ctx.fillStyle = Math.random() < 0.07 * k ? accent : bone
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
        ctx.lineTo(cx + Math.cos(a - spread) * R, cy + Math.sin(a - spread) * R)
        ctx.lineTo(cx + Math.cos(a + spread) * R, cy + Math.sin(a + spread) * R)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [intensity])

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />
}

function KanjiAct({ leaving }: { leaving: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      animate={leaving ? { scale: 1.7, opacity: 0, filter: 'blur(10px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: EASE_IN_OUT }}
    >
      <div className="flex items-center gap-[5vmin]">
        <motion.div
          className="hidden flex-col items-end gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--sy-bone)]/50 sm:flex"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
        >
          <span>Monogatari</span>
          <span className="h-px w-16 bg-[var(--sy-bone)]/30" />
          <span>Hikâye</span>
        </motion.div>

        <div className="relative flex flex-col items-center font-sans font-black leading-[0.95] text-[clamp(7rem,30vmin,22rem)]">
          {['物', '語'].map((ch, i) => (
            <span key={ch} className="relative block">
              <span
                className="absolute inset-0 translate-x-[0.04em] translate-y-[0.03em] text-transparent"
                style={{ WebkitTextStroke: '1px var(--sy-accent)' }}
              >
                {ch}
              </span>
              <motion.span
                className="relative block text-[var(--sy-bone)]"
                initial={{ clipPath: 'inset(0 0 100% 0)', y: -24 }}
                animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
                transition={{ duration: 0.75, delay: 0.1 + i * 0.32, ease: EASE_OUT }}
              >
                {ch}
              </motion.span>
            </span>
          ))}

          <motion.span
            className="absolute -right-[0.42em] bottom-[0.1em] flex size-[0.36em] items-center justify-center rounded-[0.04em] bg-[var(--sy-accent)] text-[0.2em] font-black text-[var(--sy-bone)]"
            initial={{ scale: 2.6, opacity: 0, rotate: 12 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 1.05 }}
          >
            シ
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}

function Tunnel({ covers }: { covers: string[] }) {
  const items = covers.length > 0 ? covers.slice(0, 18) : Array.from({ length: 14 }, () => '')
  const glyphs = '物語夢光影刃星風'
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ perspective: '900px' }}>
      <div className="absolute left-1/2 top-1/2" style={{ transformStyle: 'preserve-3d' }}>
        {items.map((src, i) => {
          const angle = i * 2.39996
          const radius = 20 + (i % 3) * 10
          return (
            <motion.div
              key={i}
              className="absolute aspect-[2/3] w-[15vmin] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sm"
              style={{ left: `${Math.cos(angle) * radius}vmin`, top: `${Math.sin(angle) * radius}vmin` }}
              initial={{ z: -2600, opacity: 0, rotateZ: (i % 2 ? 1 : -1) * 8 }}
              animate={{ z: 760, opacity: [0, 1, 1, 0], rotateZ: 0 }}
              transition={{ duration: 1.15, delay: i * 0.04, ease: [0.55, 0, 0.9, 0.45], times: [0, 0.25, 0.85, 1] }}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <span className="flex h-full w-full items-center justify-center border border-[var(--sy-bone)]/20 bg-[var(--sy-void)] text-[8vmin] font-black text-[var(--sy-bone)]/70">
                  {glyphs[i % glyphs.length]}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Subtitle({ text }: { text: string }) {
  return (
    <motion.p
      aria-hidden
      className="absolute inset-x-0 bottom-[calc(var(--sy-bar)+1.75rem)] px-6 text-center text-base font-semibold text-[var(--sy-bone)] sm:text-xl"
      style={{ textShadow: '0 2px 0 var(--sy-void), 0 0 14px var(--sy-void)' }}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      variants={{ show: { transition: { staggerChildren: 0.022, delayChildren: 0.25 } } }}
    >
      {text.split('').map((c, i) => (
        <motion.span key={i} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} transition={{ duration: 0.01 }}>
          {c}
        </motion.span>
      ))}
    </motion.p>
  )
}

/* ───────────────────────── Act III : impact + title ───────────────────────── */

function ImpactFrame() {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 bg-[var(--sy-bone)]"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 0.8, 0] }}
        transition={{ duration: 0.32, times: [0, 0.3, 0.45, 1] }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 bg-[var(--sy-bone)] mix-blend-difference"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0] }}
        transition={{ duration: 0.42, delay: 0.08, times: [0, 0.2, 0.4, 0.6, 1] }}
      />
    </>
  )
}

function FinalHalf({
  side,
  phase,
  cover,
  animateIn,
  reduced,
}: {
  side: 'top' | 'bottom'
  phase: Phase
  cover?: string
  animateIn: boolean
  reduced: boolean
}) {
  const dir = side === 'top' ? -1 : 1
  const clipPath =
    side === 'top'
      ? `polygon(0 0, 100% 0, 100% ${CUT.right}%, 0 ${CUT.left}%)`
      : `polygon(0 ${CUT.left - 0.15}%, 100% ${CUT.right - 0.15}%, 100% 100%, 0 100%)`

  const animate =
    phase === 'exit'
      ? reduced
        ? { opacity: 0 }
        : { y: `${dir * 112}%`, x: `${-dir * 5}%`, rotate: dir * -3 }
      : phase === 'title' && animateIn
        ? { x: ['0vw', '0vw', `${-dir * 1.6}vw`, '0vw'] }
        : { x: '0vw' }

  const transition =
    phase === 'exit'
      ? { duration: reduced ? 0.35 : 1.05, ease: EASE_IN_OUT, delay: reduced ? 0 : 0.12 }
      : { duration: 1.9, times: [0, 0.56, 0.6, 1], ease: 'easeOut' as const }

  return (
    <motion.div aria-hidden className="absolute inset-0 will-change-transform" style={{ clipPath }} animate={animate} transition={transition}>
      <div className="absolute inset-0 bg-[var(--sy-void)]" />

      {cover && (
        <motion.img
          src={cover}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          style={{ filter: 'blur(28px) saturate(1.25)' }}
          initial={animateIn ? { scale: 1.35 } : false}
          animate={{ scale: 1.1 }}
          transition={{ duration: 9, ease: EASE_OUT }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--sy-void)_78%)]" />

      <motion.span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-sans text-[62vmin] font-black leading-none text-transparent"
        style={{ WebkitTextStroke: '1px color-mix(in oklab, var(--sy-bone) 9%, transparent)' }}
        initial={animateIn ? { x: '4vw', opacity: 0 } : false}
        animate={{ x: '-2vw', opacity: 1 }}
        transition={{ duration: 10, ease: 'linear' }}
      >
        物語
      </motion.span>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4">
        <motion.span
          className="font-mono text-xs uppercase tracking-[0.9em] text-[var(--sy-accent)] sm:text-sm"
          initial={animateIn ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT }}
        >
          シセリス
        </motion.span>

        <Logo animateIn={animateIn} />

        <motion.div
          className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--sy-bone)]/55"
          initial={animateIn ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95, ease: EASE_OUT }}
        >
          <span className="h-px w-8 bg-[var(--sy-bone)]/35 sm:w-14" />
          Anime Arşivi · Est. 2026
          <span className="h-px w-8 bg-[var(--sy-bone)]/35 sm:w-14" />
        </motion.div>
      </div>
    </motion.div>
  )
}

function Logo({ animateIn }: { animateIn: boolean }) {
  return (
    <div className="relative select-none font-sans text-[clamp(3.5rem,17vw,16rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]">
      <motion.div
        className="absolute inset-0"
        initial={animateIn ? { x: -36, opacity: 0 } : false}
        animate={{ x: [-36, -36, 12, -5, -3], opacity: [0, 1, 1, 1, 0.9] }}
        transition={{ duration: 1.3, delay: 0.1, times: [0, 0.35, 0.55, 0.75, 1], ease: 'easeOut' }}
      >
        <LogoLetters animateIn={animateIn} color="var(--sy-accent)" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={animateIn ? { x: 36, opacity: 0 } : false}
        animate={{ x: [36, 36, -12, 5, 3], opacity: [0, 1, 1, 1, 0.75] }}
        transition={{ duration: 1.3, delay: 0.1, times: [0, 0.35, 0.55, 0.75, 1], ease: 'easeOut' }}
      >
        <LogoLetters animateIn={animateIn} color="var(--sy-cyan)" />
      </motion.div>
      <div className="relative">
        <LogoLetters animateIn={animateIn} color="var(--sy-bone)" />
      </div>
    </div>
  )
}

function LogoLetters({ animateIn, color }: { animateIn: boolean; color: string }) {
  return (
    <span className="flex" style={{ color }}>
      {LOGO.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={animateIn ? { opacity: 0, scale: 3, filter: 'blur(16px)' } : false}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, delay: 0.12 + i * 0.055, ease: EASE_OUT }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

function Slash({ phase, animateIn, reduced }: { phase: Phase; animateIn: boolean; reduced: boolean }) {
  if (reduced) return null
  const d = `M0 ${CUT.left} L100 ${CUT.right}`
  const exiting = phase === 'exit'
  const show = exiting || animateIn

  if (!show) return null
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ filter: 'drop-shadow(0 0 10px var(--sy-accent)) drop-shadow(0 0 2px var(--sy-bone))' }}
    >
      <motion.path
        key={exiting ? 'exit' : 'title'}
        d={d}
        fill="none"
        stroke="var(--sy-bone)"
        strokeWidth={exiting ? 3 : 2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: exiting ? 1 : 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={
          exiting
            ? { duration: 0.55, times: [0, 0.1, 0.4, 1] }
            : { pathLength: { duration: 0.18, delay: 0.95, ease: 'easeIn' }, opacity: { duration: 0.7, delay: 0.95, times: [0, 0.05, 0.5, 1] } }
        }
      />
    </svg>
  )
}

/* ───────────────────────── HUD : cinemascope letterbox ───────────────────────── */

function Letterbox({
  phase,
  reduced,
  tcRef,
  pctRef,
  barRef,
  progressRef,
  onSkip,
}: {
  phase: Phase
  reduced: boolean
  tcRef: MutableRefObject<HTMLSpanElement | null>
  pctRef: MutableRefObject<HTMLSpanElement | null>
  barRef: MutableRefObject<HTMLSpanElement | null>
  progressRef: MutableRefObject<HTMLDivElement | null>
  onSkip: () => void
}) {
  const exiting = phase === 'exit'
  const barTransition = { duration: reduced ? 0 : 0.8, ease: EASE_IN_OUT }

  return (
    <>
      <motion.header
        className="absolute inset-x-0 top-0 z-30 flex h-[var(--sy-bar)] items-center justify-between gap-4 bg-[var(--sy-void)] px-5 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--sy-bone)]/55 sm:px-10"
        initial={{ y: '-100%' }}
        animate={{ y: exiting ? '-100%' : '0%' }}
        transition={barTransition}
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-2 rounded-full bg-[var(--sy-accent)]"
            style={{ animation: 'sy-rec 1.2s steps(2) infinite' }}
          />
          Sytheris Pictures
        </span>
        <span className="hidden md:inline">第一話 · Bölüm 00 — Uyanış</span>
        <span ref={tcRef} className="tabular-nums" aria-hidden>
          00:00:00:00
        </span>
      </motion.header>

      <motion.footer
        className="absolute inset-x-0 bottom-0 z-30 flex h-[var(--sy-bar)] items-center justify-between gap-4 bg-[var(--sy-void)] px-5 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--sy-bone)]/55 sm:px-10"
        initial={{ y: '100%' }}
        animate={{ y: exiting ? '100%' : '0%' }}
        transition={barTransition}
      >
        <span className="relative hidden h-4 min-w-48 overflow-hidden sm:block">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ACTS[phase]}
              className="absolute inset-0 whitespace-nowrap"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              {ACTS[phase]}
            </motion.span>
          </AnimatePresence>
        </span>

        <div
          ref={progressRef}
          role="progressbar"
          aria-label="Açılış ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          className="flex items-center gap-3"
        >
          <span className="relative h-px w-20 overflow-hidden bg-[var(--sy-bone)]/20 sm:w-40">
            <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-[var(--sy-accent)]" />
          </span>
          <span ref={pctRef} className="tabular-nums text-[var(--sy-bone)]/80">
            000
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-[11px] uppercase tracking-[0.3em] text-[var(--sy-bone)]/70 transition-colors duration-200 hover:text-[var(--sy-bone)] focus-visible:outline-2 focus-visible:outline-[var(--sy-bone)]"
        >
          Geç
          <kbd className="rounded border border-[var(--sy-bone)]/25 px-1.5 py-0.5 font-mono text-[10px] tracking-normal">ESC</kbd>
        </button>
      </motion.footer>
    </>
  )
}
