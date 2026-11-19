import { cn } from '@/lib/utils'

/** Background stack shared by the gate and maintenance screens: painting, centre wash and two fog banks. */
export function MistBackdrop({ src }: { src: string }) {
  return (
    <>
      <div className="mist-art" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      <div className="mist-wash" aria-hidden="true" />
      <div className="mist-fog mist-fog-a" aria-hidden="true" />
      <div className="mist-fog mist-fog-b" aria-hidden="true" />
    </>
  )
}

/** Hairline rule with a knotted diamond at its centre, drawn outwards from the middle. */
export function MistRule({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-full max-w-md items-center gap-3 text-[var(--mist-ink)]', className)} aria-hidden="true">
      <span className="mist-rule-line h-px flex-1 bg-[linear-gradient(90deg,transparent,currentColor)] opacity-60" />
      <svg viewBox="0 0 64 16" className="h-4 w-16 shrink-0">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 8 H18 M46 8 H62" opacity="0.6" />
          <path d="M18 8 C22 3 26 3 28 8 C26 13 22 13 18 8 Z" />
          <path d="M46 8 C42 3 38 3 36 8 C38 13 42 13 46 8 Z" />
          <path d="M32 2 L37 8 L32 14 L27 8 Z" />
        </g>
        <path d="M32 5 L34.5 8 L32 11 L29.5 8 Z" fill="currentColor" />
      </svg>
      <span className="mist-rule-line h-px flex-1 bg-[linear-gradient(270deg,transparent,currentColor)] opacity-60" />
    </div>
  )
}

export function MistBrand() {
  return (
    <span className="font-sans text-sm font-extrabold tracking-[0.32em]">SYTHERIS</span>
  )
}
