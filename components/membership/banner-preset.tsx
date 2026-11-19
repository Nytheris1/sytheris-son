import { isVideoMedia, resolveBannerOverlay, type BannerOverlay } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { Blossom, Bow, Filigree, Pendant, RibbonDefs, Sparkle, StarGem, Streamer, useRibbonPaint, type RibbonPaint } from './ribbon-ornaments'

function Piece({ className, viewBox, children }: { className: string; viewBox: string; children: (p: RibbonPaint) => React.ReactNode }) {
  const p = useRibbonPaint()
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true">
      <RibbonDefs p={p} />
      {children(p)}
    </svg>
  )
}

/** Kızıl Kurdele banner frame: rose-gold moulding, a ruby crest, bows on opposite corners and hanging drops. */
export function RibbonBannerFrame({ className }: { className?: string }) {
  return (
    <div className={cn('rb-banner', className)} aria-hidden="true">
      <span className="rb-banner-mould" />
      <span className="rb-banner-line" />
      <Piece className="rb-banner-crest" viewBox="-14 -14 28 28">
        {(p) => <StarGem p={p} />}
      </Piece>
      <Piece className="rb-banner-streamer" viewBox="0 0 24 104">
        {(p) => <Streamer p={p} />}
      </Piece>
      <Piece className="rb-banner-tl" viewBox="-30 -22 64 60">
        {(p) => <Bow p={p} x={0} y={0} rotate={-14} scale={1.15} />}
      </Piece>
      <Piece className="rb-banner-tr" viewBox="0 0 40 52">
        {(p) => (
          <>
            <Filigree p={p} x={36} y={4} rotate={90} />
            <Pendant p={p} x={24} y={20} pearls={2} />
            <Sparkle p={p} x={8} y={10} scale={0.6} />
          </>
        )}
      </Piece>
      <Piece className="rb-banner-bl" viewBox="0 0 44 40">
        {(p) => (
          <>
            <Filigree p={p} x={4} y={36} rotate={-90} />
            <Blossom p={p} x={14} y={24} rotate={-20} scale={0.95} />
          </>
        )}
      </Piece>
      <Piece className="rb-banner-br" viewBox="-30 -22 64 70">
        {(p) => (
          <>
            <Pendant p={p} x={-10} y={10} pearls={2} />
            <Pendant p={p} x={9} y={12} pearls={3} scale={0.9} />
            <Bow p={p} x={0} y={0} rotate={12} scale={1.05} />
          </>
        )}
      </Piece>
    </div>
  )
}

/** Frame layer drawn on top of the user's own banner image or video. */
export function BannerOverlayLayer({ overlay, className }: { overlay?: BannerOverlay | string | null; className?: string }) {
  if (resolveBannerOverlay({ bannerOverlay: overlay ?? null }) !== 'ribbon') return null
  return <RibbonBannerFrame className={className} />
}

/** Banner surface used by profile cards. The user's image or video is always the base; the frame sits on top. */
export function ProfileBanner({
  src,
  dim = 40,
  overlay,
  className,
}: {
  preset?: string | null
  src?: string | null
  dim?: number
  overlay?: BannerOverlay | string | null
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden bg-scrim', className)}>
      {src ? (
        isVideoMedia(src) ? (
          <video src={src} autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover" aria-hidden="true" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent_60%)]" />
      )}
      <div className="absolute inset-0 bg-scrim" style={{ opacity: Math.min(0.9, dim / 100) * 0.6 }} />
      <BannerOverlayLayer overlay={overlay} />
    </div>
  )
}
