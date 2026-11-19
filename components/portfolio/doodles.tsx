import { cn } from '@/lib/utils'

/* Hand-drawn marks for the portfolio: deliberately wobbly strokes, round caps, no fills unless noted. */

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={cn('fo-draw', className)} aria-hidden="true">
      <path {...stroke} strokeWidth="5" pathLength={1} d="M150 20 C120 60 30 70 40 120 C48 160 120 130 118 168 C116 200 60 205 30 190 M60 90 C90 98 140 80 170 100 C190 114 168 150 140 150" />
    </svg>
  )
}

export function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 64" className={className} aria-hidden="true">
      <path d="M30 4 C22 16 12 18 12 32 C12 46 20 58 30 60 C40 58 48 46 48 32 C48 24 44 20 40 14 C38 22 34 24 32 24 C34 16 33 10 30 4 Z" fill="currentColor" />
      <text x="30" y="47" textAnchor="middle" fontSize="18" fontWeight="900" fill="var(--fo-bg)" fontFamily="var(--font-anton), sans-serif">
        1
      </text>
    </svg>
  )
}

export function Burst({ className }: { className?: string }) {
  const pts = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    const r = i % 2 ? 22 : 48
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={pts} fill="currentColor" />
    </svg>
  )
}

export function Kisses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={cn('fo-draw', className)} aria-hidden="true">
      <path {...stroke} strokeWidth="6" pathLength={1} d="M10 14 L34 38 M34 14 L10 38 M56 8 L80 32 M80 8 L56 32 M18 50 C40 58 70 58 100 44" />
    </svg>
  )
}

export function Corner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <path d="M4 4 V56 H56" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="square" />
    </svg>
  )
}

export function Cursor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M11 4 V18 L8.5 15.5 C7.5 14.5 5.8 14.6 5 15.8 C4.3 16.8 4.6 18 5.4 18.8 L11.5 26 C12.6 27.3 14.2 28 16 28 H20 C23.3 28 26 25.3 26 22 V14 C26 12.9 25.1 12 24 12 C22.9 12 22 12.9 22 14 V13 C22 11.9 21.1 11 20 11 C18.9 11 18 11.9 18 13 V12 C18 10.9 17.1 10 16 10 C14.9 10 14 10.9 14 12 V4 C14 3.2 13.3 2.5 12.5 2.5 C11.7 2.5 11 3.2 11 4 Z" fill="currentColor" stroke="var(--fo-bg)" strokeWidth="1.4" />
    </svg>
  )
}

/** Circular rotating label, words separated by dots. */
export function TextRing({ words, className }: { words: string[]; className?: string }) {
  const text = `${words.join(' • ')} • `
  return (
    <svg viewBox="0 0 200 200" className={cn('fo-spin', className)} aria-hidden="true">
      <defs>
        <path id="fo-ring" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
      </defs>
      <text fill="currentColor" fontSize="19" fontWeight="800" letterSpacing="4" fontFamily="var(--font-sans), sans-serif">
        <textPath href="#fo-ring" textLength="486" lengthAdjust="spacing">
          {text.repeat(Math.max(1, Math.round(40 / text.length)))}
        </textPath>
      </text>
    </svg>
  )
}
