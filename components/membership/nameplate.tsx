import { resolveNameplate } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { Pendant, RibbonDefs, useRibbonPaint } from './ribbon-ornaments'

function Cap({ side }: { side: 'left' | 'right' }) {
  const p = useRibbonPaint()
  return (
    <svg className={cn('rb-plate-cap', side === 'left' ? 'rb-plate-cap-l' : 'rb-plate-cap-r')} viewBox="-14 -14 28 28" aria-hidden="true">
      <RibbonDefs p={p} />
      <path d="M0 -13 L2 -2 L13 0 L2 2 L0 13 L-2 2 L-13 0 L-2 -2 Z" fill={`url(#${p.gold})`} />
      <path d="M0 -8 L5.2 0 L0 8 L-5.2 0 Z" fill={`url(#${p.ruby})`} stroke={`url(#${p.gold})`} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M-5.2 0 H5.2 M0 -8 V8" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.45" />
    </svg>
  )
}

function Drop() {
  const p = useRibbonPaint()
  return (
    <svg className="rb-plate-drop" viewBox="-6 0 12 28" aria-hidden="true">
      <RibbonDefs p={p} />
      <Pendant p={p} x={0} y={0} pearls={1} scale={1.1} />
    </svg>
  )
}

/** Wraps a display name in the Kızıl Kurdele plate; any other stored value renders the name untouched. */
export function NamePlate({ plate, children, className }: { plate?: string | null; children: React.ReactNode; className?: string }) {
  if (resolveNameplate(plate) !== 'ribbon') return <>{children}</>
  return (
    <span className={cn('rb-plate', className)}>
      <Cap side="left" />
      <span className="rb-plate-text">{children}</span>
      <Cap side="right" />
      <Drop />
    </span>
  )
}
