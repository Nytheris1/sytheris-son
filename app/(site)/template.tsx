'use client'

import { motion, type TargetAndTransition } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type Variant = { initial: TargetAndTransition; animate: TargetAndTransition; overlay?: 'curtain' | 'iris' | 'shutter' }

const EASE = [0.2, 0.8, 0.2, 1] as const

function variantFor(pathname: string): Variant {
  if (pathname === '/') return { initial: { opacity: 0, scale: 0.985 }, animate: { opacity: 1, scale: 1 } }
  if (pathname.startsWith('/anime')) return { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, overlay: 'curtain' }
  if (pathname.startsWith('/rastgele')) return { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, overlay: 'iris' }
  if (pathname.startsWith('/kutuphane')) return { initial: { opacity: 0, x: -36 }, animate: { opacity: 1, x: 0 }, overlay: 'shutter' }
  if (pathname.startsWith('/ara')) return { initial: { opacity: 0, x: 36 }, animate: { opacity: 1, x: 0 } }
  if (pathname.startsWith('/takvim')) return { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } }
  if (pathname.startsWith('/ayarlar') || pathname.startsWith('/abonelik')) return { initial: { opacity: 0, y: -18 }, animate: { opacity: 1, y: 0 } }
  return { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } }
}

function Overlay({ kind }: { kind: NonNullable<Variant['overlay']> }) {
  if (kind === 'curtain') {
    return (
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] origin-top bg-primary"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
      />
    )
  }
  if (kind === 'iris') {
    return (
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] bg-scrim"
        initial={{ clipPath: 'circle(150% at 50% 50%)' }}
        animate={{ clipPath: 'circle(0% at 50% 50%)' }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
    )
  }
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] flex">
      {Array.from({ length: 6 }, (_, i) => (
        <motion.span
          key={i}
          className="h-full flex-1 origin-left bg-primary"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.45, delay: i * 0.05, ease: [0.76, 0, 0.24, 1] }}
        />
      ))}
    </div>
  )
}

/** Opens the same shutters the welcome film closed, so leaving /hosgeldin reads as one continuous cut. */
function CurtainOpen() {
  const panels = 7
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[150] flex">
      {Array.from({ length: panels }, (_, i) => (
        <motion.span
          key={i}
          className="h-full flex-1 border-x border-scrim/30 bg-primary"
          initial={{ y: '0%' }}
          animate={{ y: i % 2 ? '101%' : '-101%' }}
          transition={{ duration: 0.85, delay: 0.15 + Math.abs(i - (panels - 1) / 2) * 0.05, ease: [0.83, 0, 0.17, 1] }}
        />
      ))}
      <motion.p
        lang="en"
        className="absolute inset-0 flex items-center justify-center text-[clamp(56px,12vw,190px)] font-black uppercase tracking-[-0.06em] text-primary-foreground"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35 }}
      >
        Sytheris
      </motion.p>
    </div>
  )
}

function hasWelcomeHandoff() {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem('sy-from-welcome') === '1'
  } catch {
    return false
  }
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const v = variantFor(pathname)
  const [handoff] = useState(hasWelcomeHandoff)

  useEffect(() => {
    if (!handoff) return
    try {
      sessionStorage.removeItem('sy-from-welcome')
    } catch {}
  }, [handoff])
  return (
    <>
      {handoff ? <CurtainOpen /> : v.overlay && <Overlay kind={v.overlay} />}
      <motion.div initial={v.initial} animate={v.animate} transition={{ duration: 0.55, ease: EASE }}>
        {children}
      </motion.div>
    </>
  )
}
