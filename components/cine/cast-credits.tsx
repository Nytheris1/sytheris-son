import Link from 'next/link'
import { ArrowUpRight, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CreditPerson = { href: string; name: string; character: string | null; image: string | null }

function Portrait({ src, className }: { src: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={cn('cine-portrait size-full object-cover object-top', className)} />
  ) : (
    <span className={cn('grid size-full place-items-center bg-muted text-muted-foreground', className)}>
      <UserRound className="size-8" aria-hidden="true" />
    </span>
  )
}

/** Opening-titles cast list: three billed leads as tall portraits, the ensemble as a compact roll. */
export function CastCredits({ people }: { people: CreditPerson[] }) {
  if (!people.length) return null
  const leads = people.slice(0, 3)
  const rest = people.slice(3)

  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
        {leads.map((p, i) => (
          <li key={p.href} className={cn(i === 0 && 'col-span-2 sm:col-span-1')}>
            <Link href={p.href} className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none transition focus-visible:ring-2 focus-visible:ring-primary">
              <span className="absolute inset-0 overflow-hidden">
                <Portrait src={p.image} />
              </span>
              <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/40 to-transparent" aria-hidden="true" />
              <span className="relative flex flex-col gap-1.5 p-4 text-on-scrim sm:p-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Başrol</span>
                <span className="text-balance text-2xl font-bold leading-none tracking-[-0.03em] sm:text-3xl">{p.name}</span>
                {p.character && <span className="font-serif text-lg italic leading-snug text-on-scrim/75">{p.character}</span>}
              </span>
              <ArrowUpRight className="absolute right-4 top-4 size-5 text-on-scrim opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {rest.length > 0 && (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="group flex items-center gap-4 rounded-lg border-b border-border py-3 pr-2 outline-none transition hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-primary">
                <span className="size-14 shrink-0 overflow-hidden rounded-full ring-1 ring-border transition group-hover:ring-primary">
                  <Portrait src={p.image} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-semibold transition group-hover:text-ink">{p.name}</span>
                  {p.character && <span className="truncate font-serif text-sm italic text-muted-foreground">{p.character}</span>}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CastCreditsSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('skeleton aspect-[3/4] rounded-lg', i === 0 && 'col-span-2 sm:col-span-1')} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton size-14 rounded-full" />
            <div className="skeleton h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Section heading used across cinema detail pages: mono eyebrow, sans title, serif accent. */
export function CineHeading({ id, eyebrow, title, accent, aside }: { id?: string; eyebrow: string; title: string; accent?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <p className="label-mono flex items-center gap-3 text-ink">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 id={id} className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
          {title} {accent && <span className="accent-serif">{accent}</span>}
        </h2>
      </div>
      {aside}
    </div>
  )
}
