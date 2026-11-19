'use client'

import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const value = useMotionValue(0)
  const rounded = useTransform(value, (v) => Math.round(v))
  const offset = useTransform(value, (v) => c - (v / 100) * c)

  useEffect(() => {
    const controls = animate(value, score, { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 })
    return () => controls.stop()
  }, [score, value])

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Ortalama puan ${score} / 100`}>
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="5" />
        <motion.circle cx="36" cy="36" r={r} fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} style={{ strokeDashoffset: offset }} />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <motion.span className="text-xl font-bold tabular-nums">{rounded}</motion.span>
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-widest opacity-60">puan</span>
      </span>
    </div>
  )
}
