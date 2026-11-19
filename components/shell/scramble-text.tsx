'use client'

import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPRSTUVYZ#%&*+=/<>'

export function ScrambleText({ text, className, duration = 650 }: { text: string; className?: string; duration?: number }) {
  const [out, setOut] = useState(text)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      setOut(text)
      return
    }
    if (document.documentElement.classList.contains('reduce-motion')) {
      setOut(text)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const revealed = Math.floor(p * text.length)
      setOut(
        text
          .split('')
          .map((c, i) => (c === ' ' ? ' ' : i < revealed ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      )
      if (p < 1) raf = requestAnimationFrame(tick)
      else setOut(text)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, duration])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  )
}
