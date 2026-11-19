import { isVideoMedia, resolveFrame } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { Blossom, Bow, Pendant, RibbonDefs, Sparkle, StarGem, useRibbonPaint } from './ribbon-ornaments'

type Props = {
  src?: string | null
  name: string
  /** Accepts any stored value; anything other than `ribbon` renders unframed. */
  frame?: string | null
  className?: string
  /** Kept for older call sites. */
  ringWidth?: number
}

/**
 * The avatar box (0–120 in SVG units) is the photo; ornaments overflow it by 25% on every side.
 * Below ~52px the bow, blossom and pendant hide via a container query so header-sized avatars stay crisp.
 */
function RibbonRing() {
  const p = useRibbonPaint()
  return (
    <svg className="rb-avatar" viewBox="-30 -30 180 180" aria-hidden="true">
      <RibbonDefs p={p} />
      <circle cx="60" cy="60" r="67.4" fill="none" stroke={`url(#${p.gold})`} strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.01 8.82" className="rb-detail" />
      <circle cx="60" cy="60" r="65" fill="none" stroke={`url(#${p.gold})`} strokeWidth="1" opacity="0.9" />
      <circle cx="60" cy="60" r="61.6" fill="none" stroke={`url(#${p.gold})`} strokeWidth="4.4" />
      <circle cx="60" cy="60" r="61.6" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="0.6" strokeDasharray="0.5 7.5" />
      <circle cx="60" cy="60" r="58.4" fill="none" stroke={`url(#${p.gold})`} strokeWidth="0.9" />
      <StarGem p={p} x={60} y={-3.5} scale={1.05} />
      <g className="rb-detail">
        <Sparkle p={p} x={10} y={14} scale={0.75} />
        <Sparkle p={p} x={128} y={96} scale={0.6} />
        <Blossom p={p} x={112} y={20} rotate={18} scale={1.05} />
        <Pendant p={p} x={60} y={125.5} pearls={2} />
        <Pendant p={p} x={28} y={118} pearls={1} scale={0.85} />
        <Bow p={p} x={14} y={102} rotate={-24} scale={1.08} />
      </g>
    </svg>
  )
}

export function AvatarFrame({ src, name, frame, className = 'size-10' }: Props) {
  const f = resolveFrame(frame)
  return (
    <span className={cn('rb-frame', f === 'ribbon' && 'rb-frame-on', className)}>
      {src ? (
        isVideoMedia(src) ? (
          <video src={src} autoPlay muted loop playsInline className="rb-media" aria-label={name} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src || '/placeholder.svg'} alt={name} className="rb-media" loading="lazy" decoding="async" />
        )
      ) : (
        <span
          className="rb-media grid place-items-center bg-[linear-gradient(150deg,color-mix(in_oklch,var(--primary)_80%,white),var(--primary)_55%,color-mix(in_oklch,var(--primary)_60%,black))] font-bold uppercase text-primary-foreground [container-type:size]"
          aria-label={name}
          role="img"
        >
          <span className="leading-none" style={{ fontSize: '44cqw' }}>
            {name.slice(0, 1)}
          </span>
        </span>
      )}
      {f === 'ribbon' && <RibbonRing />}
    </span>
  )
}
