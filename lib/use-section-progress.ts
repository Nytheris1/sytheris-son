'use client'

import { useScroll, useTransform, type MotionValue } from 'motion/react'
import type { RefObject } from 'react'

type Offset = NonNullable<Parameters<typeof useScroll>[0]>['offset']

/**
 * Scroll progress of a section, 0 → 1.
 *
 * Motion 14 hands `useTransform(scrollYProgress, [...], [...])` straight to a native ViewTimeline animation
 * when the value drives opacity/filter/transform. For tall sticky sections that timeline's range is computed
 * wrong, so layers meant to fade in at the end (the welcome film's white-out) sat fully opaque from the start
 * and covered the whole intro. Passing the value through a function transform keeps it on the JS path,
 * which is exact and still runs every frame.
 */
export function useSectionProgress(target: RefObject<HTMLElement | null>, offset: Offset): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset })
  return useTransform(scrollYProgress, (v) => v)
}
