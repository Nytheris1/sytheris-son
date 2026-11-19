import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeroProjection } from './hero-projection'

export type HeroFact = { label: string; value: string }

/**
 * Shared cinema-mode detail hero for films and series: projected backdrop, marquee-framed one-sheet,
 * a ticket strip of facts and an in-page programme of anchors.
 */
export function DetailHero({
  backHref,
  backLabel,
  backdrop,
  poster,
  title,
  eyebrow,
  chips,
  tagline,
  facts,
  stub,
  actions,
  sections,
  backdropVideo,
}: {
  backHref: string
  backLabel: string
  backdrop: string | null
  backdropVideo?: string | null
  poster: string
  title: string
  eyebrow: React.ReactNode
  chips?: React.ReactNode
  tagline?: string | null
  facts: HeroFact[]
  stub?: HeroFact | null
  actions: React.ReactNode
  sections: { id: string; label: string }[]
}) {
  return (
    <section className="dark relative isolate flex min-h-[88svh] flex-col overflow-hidden bg-scrim text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backdrop || poster || '/placeholder.svg'}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className={cn('absolute inset-0 -z-20 size-full object-cover', backdrop ? 'opacity-60' : 'scale-125 opacity-45 blur-3xl saturate-150')}
      />
      {backdropVideo && <HeroProjection src={backdropVideo} title={title} />}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--scrim)_0%,color-mix(in_oklch,var(--scrim)_78%,transparent)_48%,color-mix(in_oklch,var(--scrim)_25%,transparent)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-page via-page/60 to-transparent" aria-hidden="true" />
      <div className="cine-beam absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
      <span className="cine-letterbox top-0" aria-hidden="true" />
      <span className="cine-letterbox bottom-0" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-4 pb-10 pt-8 sm:px-6 lg:px-10">
        <Link href={backHref} className="flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/60 transition hover:text-primary">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> {backLabel}
        </Link>

        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-16">
          <div className="flex max-w-3xl flex-col gap-7">
            <div className="flex items-center gap-5 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster || '/placeholder.svg'} alt={`${title} afişi`} className="aspect-[2/3] w-28 shrink-0 rounded-md object-cover shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)] ring-1 ring-primary/30 sm:w-36" />
              <p className="label-mono flex flex-col gap-2 text-primary">{eyebrow}</p>
            </div>
            <p className="label-mono hidden items-center gap-3 text-primary lg:flex">
              <span className="h-px w-8 bg-primary" aria-hidden="true" />
              {eyebrow}
            </p>

            <h1 className="text-balance text-5xl font-bold leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">{title}</h1>

            {chips && <div className="flex flex-wrap items-center gap-2.5">{chips}</div>}

            {tagline && <p className="max-w-2xl text-pretty font-serif text-xl italic leading-relaxed text-foreground/80 sm:text-2xl">{tagline}</p>}

            <div className="flex flex-wrap items-center gap-3">{actions}</div>

            {facts.length > 0 && (
              <dl
                className="cine-ticket flex w-fit max-w-full flex-wrap items-stretch rounded-lg font-mono text-[10px] uppercase tracking-[0.2em]"
                style={stub ? ({ '--stub': 'calc(100% - 5.5rem)' } as React.CSSProperties) : undefined}
              >
                {facts.map((f, i) => (
                  <div key={f.label} className="flex items-stretch">
                    {i > 0 && <span className="my-2.5 w-px bg-foreground/15" aria-hidden="true" />}
                    <div className="flex flex-col justify-center gap-1.5 px-4 py-3">
                      <dt className="text-foreground/50">{f.label}</dt>
                      <dd className="max-w-[16rem] truncate text-[11px] text-foreground/90">{f.value}</dd>
                    </div>
                  </div>
                ))}
                {stub && (
                  <div className="flex items-stretch">
                    <span className="my-1 border-l border-dashed border-foreground/25" aria-hidden="true" />
                    <div className="flex w-[5.5rem] flex-col items-center justify-center gap-1.5 py-3 text-primary">
                      <dt className="text-foreground/50">{stub.label}</dt>
                      <dd className="text-base font-semibold tracking-[0.06em]">{stub.value}</dd>
                    </div>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className="relative hidden justify-self-end lg:block">
            <div className="relative w-[300px] -rotate-2 xl:w-[340px]">
              <span className="absolute -inset-4 -z-10 rounded-xl border border-primary/25 bg-scrim/60 shadow-[0_0_90px_-20px_var(--primary)]" aria-hidden="true" />
              <span className="cine-bulbs absolute inset-x-0 -top-4 h-4 -translate-y-1/2" aria-hidden="true" />
              <span className="cine-bulbs absolute inset-x-0 -bottom-4 h-4 translate-y-1/2" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poster || '/placeholder.svg'} alt={`${title} afişi`} className="aspect-[2/3] w-full rounded-md object-cover shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9)]" />
            </div>
          </div>
        </div>

        {sections.length > 1 && (
          <nav aria-label="Bu sayfada" className="scrollbar-none -mx-4 flex items-center gap-1 overflow-x-auto border-t border-foreground/10 px-4 pt-5 sm:mx-0 sm:px-0">
            <span className="mr-3 shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">Program</span>
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="group flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground">
                <span className="font-mono text-[10px] text-primary/80">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}

/** First sentence of a synopsis, used as the poster-style tagline. */
export function taglineOf(text: string | null | undefined, max = 180) {
  if (!text) return null
  const first = text.split(/(?<=[a-zçğıöşüé]{2}[.!?…])\s+(?=[A-ZÇĞİÖŞÜ"“'])/)[0]?.trim()
  if (!first) return null
  return first.length > max ? `${first.slice(0, max).replace(/\s+\S*$/, '')}…` : first
}
