'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { MASCOT, mascotImage, type MascotMood } from './mascot-config'

export const MASCOT_NAME = MASCOT.name

export type { MascotMood }

/** Resolves a mood to its image path; all paths live in mascot-config.ts. */
export function mascotSrc(mood: MascotMood | string = 'wave') {
  return mascotImage(mood)
}

type Props = {
  className?: string
  pose?: 'full' | 'bust' | 'portrait'
  mood?: MascotMood
  float?: boolean
  say?: string | null
  bubbleSide?: 'left' | 'right'
  priority?: boolean
  glow?: boolean
}

/**
 * Syra — the Sytheris mascot. `mood` picks the artwork, `pose` picks the crop:
 * `full` shows the waist-up artwork, `portrait` crops to the upper body, `bust` is a circular face crop.
 */
export function Mascot({ className, pose = 'full', mood = 'wave', float = false, say, bubbleSide = 'left', priority, glow }: Props) {
  const src = mascotSrc(pose === 'bust' ? 'avatar' : mood)

  return (
    <div
      className={cn(
        'relative',
        pose === 'bust' && 'overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklch,var(--primary)_45%,var(--scrim))_0%,var(--scrim)_75%)]',
        className,
      )}
    >
      {glow && pose !== 'bust' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] bottom-[6%] top-[18%] rounded-full bg-primary/25 blur-3xl"
        />
      )}
      <motion.div
        className="relative size-full"
        animate={float ? { y: [0, -8, 0] } : undefined}
        transition={float ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={src}
            src={src}
            alt={pose === 'bust' ? '' : `${MASCOT_NAME}, Sytheris maskotu`}
            aria-hidden={pose === 'bust' ? true : undefined}
            draggable={false}
            fetchPriority={priority ? 'high' : undefined}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              'absolute inset-0 size-full select-none',
              pose === 'full' && 'object-contain object-bottom drop-shadow-[0_30px_40px_rgb(0_0_0/0.35)]',
              pose === 'portrait' && 'object-cover object-top',
              pose === 'bust' && 'origin-[50%_40%] scale-[1.18] object-cover object-[50%_30%]',
            )}
          />
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {say && (
          <motion.div
            key={say}
            role="status"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className={cn(
              'absolute top-[8%] z-10 w-max max-w-[min(240px,60vw)] rounded-2xl border border-border bg-popover px-4 py-3 text-sm leading-relaxed text-popover-foreground shadow-xl',
              bubbleSide === 'left' ? 'right-[78%] rounded-br-sm' : 'left-[78%] rounded-bl-sm',
            )}
          >
            {say}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
