'use client'

import { motion, useTransform, type MotionValue } from 'motion/react'

const COLUMNS = 5

function Column({ covers, progress, index }: { covers: string[]; progress: MotionValue<number>; index: number }) {
  const direction = index % 2 ? 1 : -1
  const y = useTransform(progress, [0, 1], [`${direction * 4}%`, `${direction * -28}%`])
  const scale = useTransform(progress, [0, 0.85, 1], [1, 1.08, 1.5])
  return (
    <motion.ul style={{ y, scale }} className="flex flex-col gap-4 will-change-transform" aria-hidden="true">
      {covers.map((src, i) => (
        <li key={`${src}-${i}`} className="aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-on-scrim/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src || '/placeholder.svg'} alt="" loading={i < 3 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover grayscale-[0.6] transition duration-500 hover:grayscale-0" />
        </li>
      ))}
    </motion.ul>
  )
}

/**
 * 2D stand-in for the 3D cover tower, used when WebGL is unavailable (blocked GPU, old devices,
 * battery saver) or the scene fails to start. Columns of covers drift against each other with scroll
 * and the last stretch zooms in, so the dive into the white Introduction chapter still reads.
 */
export function CoverDrift({ covers, progress }: { covers: string[]; progress: MotionValue<number> }) {
  const pool = covers.filter(Boolean)
  const columns = Array.from({ length: COLUMNS }, (_, c) => {
    const list = pool.filter((_, i) => i % COLUMNS === c)
    return list.length ? [...list, ...list].slice(0, 8) : []
  })

  return (
    <div className="absolute inset-0 overflow-hidden bg-scrim">
      <div className="absolute -inset-x-[10%] -top-[20%] grid h-[160%] grid-cols-3 gap-4 opacity-70 [transform:perspective(1200px)_rotateX(14deg)] md:grid-cols-5">
        {columns.map((list, i) => (
          <div key={i} className={i > 2 ? 'hidden md:block' : undefined}>
            <Column covers={list} progress={progress} index={i} />
          </div>
        ))}
      </div>
    </div>
  )
}
