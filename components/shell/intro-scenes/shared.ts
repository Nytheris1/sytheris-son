import { Noto_Serif_JP } from 'next/font/google'

/* Japanese glyphs only — Instrument Serif has no CJK coverage. preload:false lets the browser pull just the unicode-range slices it needs. */
export const jp = Noto_Serif_JP({ weight: ['400', '600'], preload: false, display: 'swap' })

export const EXPO = [0.87, 0, 0.13, 1] as const
export const OUT = [0.16, 1, 0.3, 1] as const

export type Phase = 'signal' | 'fracture' | 'reveal' | 'enter'

export const PHASES: Phase[] = ['signal', 'fracture', 'reveal', 'enter']

/** Milliseconds from mount at which each phase begins. */
export const TIMELINE: Record<Exclude<Phase, 'signal'>, number> = {
  fracture: 1500,
  reveal: 3900,
  enter: 5600,
}

export const SCENES: Record<Phase, { kanji: string; title: string }> = {
  signal: { kanji: '信号', title: 'The Signal' },
  fracture: { kanji: '亀裂', title: 'The Fracture' },
  reveal: { kanji: '顕現', title: 'The Reveal' },
  enter: { kanji: '入界', title: 'Enter the Universe' },
}

export function reached(current: Phase, target: Phase) {
  return PHASES.indexOf(current) >= PHASES.indexOf(target)
}
