'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Clapperboard, Tv } from 'lucide-react'
import type { PersonCredit } from '@/lib/people'
import { cn } from '@/lib/utils'

type Filter = 'hepsi' | 'film' | 'dizi'

/** Year-grouped timeline of every credit, filterable by film / dizi. Linked rows open our own detail pages. */
export function ActorFilmography({ credits }: { credits: PersonCredit[] }) {
  const [filter, setFilter] = useState<Filter>('hepsi')
  const counts = { hepsi: credits.length, film: credits.filter((c) => c.kind === 'film').length, dizi: credits.filter((c) => c.kind === 'dizi').length }

  const groups = useMemo(() => {
    const list = filter === 'hepsi' ? credits : credits.filter((c) => c.kind === filter)
    const map = new Map<string, PersonCredit[]>()
    for (const c of list) {
      const k = c.year ? String(c.year) : 'Tarihsiz'
      map.set(k, [...(map.get(k) ?? []), c])
    }
    return [...map.entries()]
  }, [credits, filter])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-fit rounded-full bg-muted p-1" role="radiogroup" aria-label="Filmografi filtresi">
        {(['hepsi', 'film', 'dizi'] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            disabled={!counts[f]}
            onClick={() => setFilter(f)}
            className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm capitalize transition disabled:opacity-40', filter === f ? 'bg-primary font-semibold text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {f === 'hepsi' ? 'Hepsi' : f === 'film' ? 'Filmler' : 'Diziler'}
            <span className="font-mono text-[10px] opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      <ol className="flex flex-col">
        {groups.map(([year, items]) => (
          <li key={year} className="grid gap-4 border-t border-border py-6 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8">
            <h3 className="font-sans text-3xl font-black tracking-[-0.05em] text-foreground/25 sm:sticky sm:top-24 sm:self-start sm:text-5xl">{year}</h3>
            <ul className="grid gap-2 md:grid-cols-2">
              {items.map((c) => {
                const body = (
                  <>
                    <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-muted ring-1 ring-border">
                      {c.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.poster} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-muted-foreground">
                          {c.kind === 'film' ? <Clapperboard className="size-4" aria-hidden="true" /> : <Tv className="size-4" aria-hidden="true" />}
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">{c.kind === 'film' ? 'Film' : 'Dizi'}</span>
                      <span className={cn('line-clamp-2 font-semibold leading-snug', c.href && 'transition group-hover:text-ink')}>{c.title}</span>
                      {c.character && <span className="truncate font-serif text-sm italic text-muted-foreground">{c.character}</span>}
                    </span>
                    {c.href && <ArrowUpRight className="size-4 shrink-0 self-start text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-hidden="true" />}
                  </>
                )
                return (
                  <li key={c.key}>
                    {c.href ? (
                      <Link href={c.href} className="group flex items-center gap-4 rounded-xl p-2 outline-none transition hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-primary">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 rounded-xl p-2 opacity-80">{body}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
