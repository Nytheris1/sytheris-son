import Link from 'next/link'
import type { Film } from '@/lib/films'

/** A lit marquee sign under the hero: "Şimdi gösterimde" followed by the week's titles on an endless loop. */
export function CinemaMarquee({ items }: { items: Film[] }) {
  const list = items.slice(0, 14)
  if (!list.length) return null
  const loop = [...list, ...list]

  return (
    <section aria-label="Şimdi gösterimde" className="dark cine-marquee relative flex items-stretch overflow-hidden text-foreground">
      <p className="relative z-10 flex shrink-0 items-center gap-3 bg-primary px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-primary-foreground sm:px-6">
        <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" aria-hidden="true" />
        Şimdi gösterimde
      </p>
      <div className="relative min-w-0 flex-1 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <ul className="sy-marquee-x flex w-max items-center" style={{ '--dur': '80s' } as React.CSSProperties}>
          {loop.map((f, i) => (
            <li key={`${f.id}-${i}`} className="flex items-center" aria-hidden={i >= list.length ? true : undefined}>
              <Link href={`/film/${f.id}`} tabIndex={i >= list.length ? -1 : undefined} className="cine-marquee-text px-6 text-lg font-bold tracking-[-0.01em] transition hover:brightness-125">
                {f.title}
              </Link>
              <span className="size-1.5 rounded-full bg-primary/50" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
