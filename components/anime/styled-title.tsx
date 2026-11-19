'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { TITLE_STYLES, titleStyleFor, type TitleStyle } from '@/lib/title-fonts'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  genres?: string[]
  tags?: string[]
  style?: TitleStyle
  as?: 'h1' | 'h2' | 'p'
  className?: string
  animate?: boolean
}

const OUT = [0.16, 1, 0.3, 1] as const
/** Effects that paint text through `background-clip: text` cannot run on individually transformed letters. */
const CLIP_STYLES = new Set<TitleStyle>(['fantasy', 'supernatural', 'romance'])

/**
 * Renders an anime title in a typeface + effect that matches its genre.
 * Letters rise in one by one, then the title settles into a single static node carrying the full effect.
 */
export function StyledTitle({ title, genres, tags, style, as = 'h1', className, animate = true }: Props) {
  const s = style ?? titleStyleFor(genres, tags)
  const def = TITLE_STYLES[s]
  const Tag = as
  const words = title.split(/\s+/)
  const long = title.length > 34
  const [settled, setSettled] = useState(!animate)
  const duration = 700 + Math.min(900, title.length * 30)

  useEffect(() => {
    if (!animate) return
    setSettled(false)
    const t = window.setTimeout(() => setSettled(true), duration + 80)
    return () => window.clearTimeout(t)
  }, [title, animate, duration])

  const clip = CLIP_STYLES.has(s)
  const sizeStyle = long ? { fontSize: '0.74em' } : undefined

  if (settled) {
    return (
      <Tag data-title-style={s} className={cn('text-balance leading-[0.98]', def.font, def.effect, className)}>
        <span style={sizeStyle}>{title}</span>
      </Tag>
    )
  }

  let index = 0
  const step = Math.min(0.035, 0.9 / Math.max(1, title.length))
  return (
    <Tag aria-label={title} data-title-style={s} className={cn('text-balance leading-[0.98]', def.font, clip ? 'text-[var(--fx-gold)]' : def.effect, s === 'romance' && 'text-foreground', className)}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap" style={sizeStyle} aria-hidden="true">
          {word.split('').map((ch) => {
            const i = index++
            return (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: '0.45em', rotateX: -70 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: i * step, ease: OUT }}
              >
                {ch}
              </motion.span>
            )
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  )
}
