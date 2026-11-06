'use client'

import { motion, useTransform, type MotionValue } from 'motion/react'
import { useMemo } from 'react'
import { EXPO, OUT, reached, type Phase } from './shared'

export type Pointer = { x: MotionValue<number>; y: MotionValue<number> }
export type CoverSet = { rows: string[][]; front: string[] }

const ROWS = 3
const PER_ROW = 10

export function useCoverSet(covers: string[]): CoverSet {
  return useMemo(() => {
    if (!covers.length) return { rows: [], front: [] }
    const pick = (i: number) => covers[i % covers.length]
    return {
      rows: Array.from({ length: ROWS }, (_, r) => Array.from({ length: PER_ROW }, (_, c) => pick(r * PER_ROW + c))),
      front: [pick(ROWS * PER_ROW), pick(ROWS * PER_ROW + 1)],
    }
  }, [covers])
}

/* A contact sheet of key art on two depth planes. The front plane moves ~3x faster with the pointer than the back plane. */
export function World({ set, pointer, still }: { set: CoverSet; pointer: Pointer; still?: boolean }) {
  const bx = useTransform(pointer.x, (v) => v * -14)
  const by = useTransform(pointer.y, (v) => v * -10)
  const fx = useTransform(pointer.x, (v) => v * -40)
  const fy = useTransform(pointer.y, (v) => v * -28)
  const decoding = still ? 'sync' : 'async'

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div style={{ x: bx, y: by }} className="absolute inset-[-8%] flex flex-col justify-center gap-[2vh]">
        {set.rows.map((row, r) => (
          <div key={r} className="flex shrink-0 justify-center gap-[2vh]" style={{ transform: `translateX(${r % 2 ? -6 : 4}%)` }}>
            {row.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src || '/placeholder.svg'}
                alt=""
                draggable={false}
                decoding={decoding}
                className="aspect-[2/3] h-[max(30vh,14vw)] w-auto shrink-0 object-cover opacity-60"
              />
            ))}
          </div>
        ))}
      </motion.div>

      {set.front.length > 0 && (
        <motion.div style={{ x: fx, y: fy }} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={set.front[0]} alt="" draggable={false} decoding={decoding} className="absolute left-[3%] top-[12%] aspect-[2/3] h-[46vh] w-auto object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={set.front[1]} alt="" draggable={false} decoding={decoding} className="absolute bottom-[8%] right-[4%] aspect-[2/3] h-[38vh] w-auto object-cover" />
        </motion.div>
      )}
    </div>
  )
}

type Shard = { y: number; scale: number; top: number; bottom: number; tone: 'raw' | 'mono' | 'tint' }

/* Each shard is a different "reality" of the same world: displaced, rescaled and re-toned until they lock together. */
const SHARDS: Shard[] = [
  { y: -16, scale: 1.22, top: 9, bottom: 14, tone: 'mono' },
  { y: 11, scale: 1.1, top: 4, bottom: 7, tone: 'tint' },
  { y: -5, scale: 1.02, top: 2, bottom: 3, tone: 'raw' },
  { y: 13, scale: 1.14, top: 6, bottom: 4, tone: 'mono' },
  { y: -12, scale: 1.26, top: 12, bottom: 9, tone: 'tint' },
]

export function Fracture({ count, phase, set, pointer }: { count: number; phase: Phase; set: CoverSet; pointer: Pointer }) {
  const merged = reached(phase, 'reveal')
  const center = (count - 1) / 2
  const shards = count === 3 ? SHARDS.slice(1, 4) : SHARDS

  return (
    <div className="absolute inset-0">
      {shards.map((s, i) => {
        const dist = Math.abs(i - center)
        return (
          <motion.div
            key={i}
            className="absolute inset-y-0 overflow-hidden"
            style={{ left: `${(i / count) * 100}%`, width: `${100 / count}%` }}
            initial={{ clipPath: 'inset(20% 49.6% 20% 49.6%)' }}
            animate={{ clipPath: merged ? 'inset(0% 0% 0% 0%)' : `inset(${s.top}% 0.9% ${s.bottom}% 0.9%)` }}
            transition={merged ? { duration: 0.95, ease: EXPO, delay: dist * 0.05 } : { duration: 1.1, ease: EXPO, delay: dist * 0.11 }}
          >
            <motion.div
              className="absolute inset-y-0"
              style={{ width: `${count * 100}%`, left: `${-i * 100}%` }}
              initial={{ y: `${s.y}%`, scale: s.scale }}
              animate={merged ? { y: '0%', scale: 1 } : { y: `${s.y * 0.45}%`, scale: 1 + (s.scale - 1) * 0.6 }}
              transition={merged ? { duration: 1.05, ease: EXPO, delay: dist * 0.05 } : { duration: 2.6, ease: OUT }}
            >
              <World set={set} pointer={pointer} />
            </motion.div>
            {s.tone !== 'raw' && (
              <motion.div
                className={s.tone === 'mono' ? 'absolute inset-0 bg-scrim mix-blend-saturation' : 'absolute inset-0 bg-primary mix-blend-color'}
                initial={{ opacity: s.tone === 'mono' ? 1 : 0.5 }}
                animate={{ opacity: merged ? 0 : s.tone === 'mono' ? 1 : 0.5 }}
                transition={{ duration: 0.8, ease: OUT }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
