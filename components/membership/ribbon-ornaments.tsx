import { useId } from 'react'

/*
 * "Kızıl Kurdele" ornament kit — rose-gold filigree, crimson satin bows, ruby drops and pearls.
 * Every cosmetic in the set (avatar frame, banner frame, nameplate) is assembled from these parts,
 * so they read as one family at any size. All paint comes from per-instance gradient ids.
 */

export type RibbonPaint = { gold: string; goldSoft: string; satin: string; satinDeep: string; ruby: string; pearl: string; cream: string }

export function useRibbonPaint(): RibbonPaint {
  const base = `rb${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return {
    gold: `${base}-gold`,
    goldSoft: `${base}-goldsoft`,
    satin: `${base}-satin`,
    satinDeep: `${base}-satindeep`,
    ruby: `${base}-ruby`,
    pearl: `${base}-pearl`,
    cream: `${base}-cream`,
  }
}

export function RibbonDefs({ p }: { p: RibbonPaint }) {
  return (
    <defs>
      <linearGradient id={p.gold} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff3dc" />
        <stop offset="0.22" stopColor="#efc597" />
        <stop offset="0.48" stopColor="#b9814f" />
        <stop offset="0.7" stopColor="#f6d9b0" />
        <stop offset="1" stopColor="#94592f" />
      </linearGradient>
      <linearGradient id={p.goldSoft} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff6e6" />
        <stop offset="1" stopColor="#d8a876" />
      </linearGradient>
      <linearGradient id={p.satin} x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#f0535e" />
        <stop offset="0.45" stopColor="#c3172a" />
        <stop offset="1" stopColor="#7c0918" />
      </linearGradient>
      <linearGradient id={p.satinDeep} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9e0f20" />
        <stop offset="1" stopColor="#560510" />
      </linearGradient>
      <radialGradient id={p.ruby} cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffb3b8" />
        <stop offset="0.35" stopColor="#e3213a" />
        <stop offset="1" stopColor="#5e0410" />
      </radialGradient>
      <radialGradient id={p.pearl} cx="0.35" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#f5e9df" />
        <stop offset="1" stopColor="#c7a993" />
      </radialGradient>
      <linearGradient id={p.cream} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fffaf3" />
        <stop offset="1" stopColor="#f0d6bd" />
      </linearGradient>
    </defs>
  )
}

const url = (id: string) => `url(#${id})`

/** Satin bow centred on its knot. Roughly 46 × 46 units, tails hang down to y≈30. */
export function Bow({ p, x = 0, y = 0, rotate = 0, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; rotate?: number; scale?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} className={className}>
      <path d="M-2 2 C-5 9 -10 16 -15 24.5 L-10 24 L-8 30 C-4 21 -1 12 1 3 Z" fill={url(p.satin)} stroke={url(p.gold)} strokeWidth="0.55" strokeLinejoin="round" />
      <path d="M2 2 C4 9.5 8 17.5 12.5 26 L7.5 25.2 L5.2 31 C3 22 1 12.5 -1 3 Z" fill={url(p.satinDeep)} stroke={url(p.gold)} strokeWidth="0.55" strokeLinejoin="round" />
      <path d="M0 -0.5 C-4 -9 -14 -16.5 -21.5 -11.5 C-25.5 -7.5 -22.5 1.5 -14 3.2 C-9 4.2 -4 2.4 0 1 Z" fill={url(p.satin)} stroke={url(p.gold)} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M0 -0.5 C4 -9 14 -16.5 21.5 -11.5 C25.5 -7.5 22.5 1.5 14 3.2 C9 4.2 4 2.4 0 1 Z" fill={url(p.satin)} stroke={url(p.gold)} strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M-1 0 C-5 -5.5 -11.5 -9 -16.5 -7.5 C-12 -5 -6.5 -2 -1 0.8 Z" fill={url(p.satinDeep)} opacity="0.85" />
      <path d="M1 0 C5 -5.5 11.5 -9 16.5 -7.5 C12 -5 6.5 -2 1 0.8 Z" fill={url(p.satinDeep)} opacity="0.85" />
      <path d="M-19 -9 C-15 -12.5 -10 -12 -6 -8" fill="none" stroke="#ffd0d3" strokeOpacity="0.55" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M19 -9 C15 -12.5 10 -12 6 -8" fill="none" stroke="#ffd0d3" strokeOpacity="0.4" strokeWidth="0.8" strokeLinecap="round" />
      <ellipse cx="0" cy="0.4" rx="4" ry="4.6" fill={url(p.satin)} stroke={url(p.gold)} strokeWidth="0.7" />
      <ellipse cx="-1.1" cy="-1.2" rx="1.3" ry="1.7" fill="#ffd6d9" opacity="0.45" />
    </g>
  )
}

/** Faceted ruby set on a four-point gold star. */
export function StarGem({ p, x = 0, y = 0, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; scale?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={className}>
      <path d="M0 -12 L1.7 -1.7 L12 0 L1.7 1.7 L0 12 L-1.7 1.7 L-12 0 L-1.7 -1.7 Z" fill={url(p.gold)} />
      <path d="M0 -7.2 L4.6 0 L0 7.2 L-4.6 0 Z" fill={url(p.ruby)} stroke={url(p.gold)} strokeWidth="1" strokeLinejoin="round" />
      <path d="M-4.6 0 H4.6 M0 -7.2 L-1.4 0 L0 7.2 M0 -7.2 L1.4 0 L0 7.2" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="0.4" />
    </g>
  )
}

/** Small free-standing sparkle in gold. */
export function Sparkle({ p, x = 0, y = 0, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; scale?: number; className?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${scale})`} d="M0 -6 C0.6 -1.2 1.2 -0.6 6 0 C1.2 0.6 0.6 1.2 0 6 C-0.6 1.2 -1.2 0.6 -6 0 C-1.2 -0.6 -0.6 -1.2 0 -6 Z" fill={url(p.goldSoft)} className={className} />
}

/** A strand of pearls ending in a long ruby drop. Hangs downwards from (x, y). */
export function Pendant({ p, x = 0, y = 0, pearls = 2, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; pearls?: number; scale?: number; className?: string }) {
  const gemTop = pearls * 4.6 + 1.5
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className={className}>
      <line x1="0" y1="0" x2="0" y2={gemTop} stroke={url(p.gold)} strokeWidth="0.6" />
      {Array.from({ length: pearls }, (_, i) => (
        <circle key={i} cx="0" cy={2.4 + i * 4.6} r="1.85" fill={url(p.pearl)} stroke="#b89176" strokeWidth="0.25" />
      ))}
      <circle cx="0" cy={gemTop + 0.6} r="1.2" fill={url(p.gold)} />
      <path d={`M0 ${gemTop + 1.2} L2.7 ${gemTop + 5.6} L0 ${gemTop + 14.5} L-2.7 ${gemTop + 5.6} Z`} fill={url(p.ruby)} stroke={url(p.gold)} strokeWidth="0.55" strokeLinejoin="round" />
      <path d={`M-2.7 ${gemTop + 5.6} H2.7 M0 ${gemTop + 1.2} V${gemTop + 14.5}`} stroke="#fff" strokeOpacity="0.35" strokeWidth="0.35" />
    </g>
  )
}

/** Five-petal cream blossom with gold leaves, used as a counterweight to the bow. */
export function Blossom({ p, x = 0, y = 0, rotate = 0, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; rotate?: number; scale?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} className={className}>
      <path d="M2 2 C6 -1 11 0 14 4 C10 5.5 5.5 5 2 2 Z" fill={url(p.gold)} />
      <path d="M-2 2 C-5 6 -5 11 -2 14 C-0.5 10 -0.6 5.5 -2 2 Z" fill={url(p.gold)} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-4" rx="2.7" ry="4.3" transform={`rotate(${a})`} fill={url(p.cream)} stroke={url(p.gold)} strokeWidth="0.45" />
      ))}
      <circle r="2" fill={url(p.gold)} />
      <circle r="0.8" cx="-0.5" cy="-0.5" fill="#fff6e6" />
    </g>
  )
}

/** Gold scroll for frame corners; drawn for the top-left corner, rotate for the others. */
export function Filigree({ p, x = 0, y = 0, rotate = 0, scale = 1, className }: { p: RibbonPaint; x?: number; y?: number; rotate?: number; scale?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} className={className} fill="none" stroke={url(p.gold)} strokeLinecap="round">
      <path d="M0 22 C0 9 9 0 22 0" strokeWidth="1.6" />
      <path d="M6 30 C4 18 10 8 20 6 C25 5 28 9 25.5 12 C23.5 14.2 20.5 12.5 21.5 10" strokeWidth="1.1" />
      <path d="M30 6 C18 4 8 10 6 20 C5 25 9 28 12 25.5 C14.2 23.5 12.5 20.5 10 21.5" strokeWidth="1.1" />
      <circle cx="3.2" cy="3.2" r="2.2" fill={url(p.pearl)} stroke="none" />
    </g>
  )
}

/** Long satin ribbon that falls in soft waves from a bow and ends in a swallow-tail cut. Drawn in a 24 × 104 box. */
export function Streamer({ p, className }: { p: RibbonPaint; className?: string }) {
  const d = 'M12 0 C4 13 4 26 11 38 C17 50 16 62 9 74 C5 81 5 88 7 95'
  return (
    <g className={className} fill="none" strokeLinecap="round">
      <path d={d} stroke={url(p.gold)} strokeWidth="7.6" />
      <path d={d} stroke={url(p.satin)} strokeWidth="6.2" />
      <path d={d} stroke={url(p.satinDeep)} strokeWidth="1.3" strokeOpacity="0.55" transform="translate(1.2 0)" />
      <path d="M8 6 C5 14 5.5 22 9 30 M13 44 C15.5 52 15 60 11 67" stroke="#ffd0d3" strokeOpacity="0.4" strokeWidth="0.9" />
      <path d="M3.6 94 L10.6 95.4 L10 104 L7 100.4 L3.2 103 Z" fill={url(p.satin)} stroke={url(p.gold)} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  )
}
