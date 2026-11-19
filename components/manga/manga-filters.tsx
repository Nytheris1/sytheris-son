import Link from 'next/link'
import { cn } from '@/lib/utils'
import { GENRES, SORTS, type SortKey } from '@/lib/manga'

type Current = { q?: string; genre?: string; sort?: SortKey; lang?: 'tr' }

function href(current: Current, patch: Partial<Current>) {
  const next = { ...current, ...patch }
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) if (v) p.set(k, String(v))
  const s = p.toString()
  return s ? `/manga?${s}` : '/manga'
}

export function MangaFilters({ current }: { current: Current }) {
  return (
    <div className="sticky top-16 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-10">
        <nav aria-label="Türler" className="scrollbar-none -mx-4 flex flex-1 gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Link
            href={href(current, { genre: undefined })}
            aria-current={!current.genre ? 'true' : undefined}
            className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm transition', !current.genre ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          >
            Tümü
          </Link>
          {GENRES.map((g) => {
            const active = current.genre === g.slug
            return (
              <Link
                key={g.slug}
                href={href(current, { genre: active ? undefined : g.slug })}
                aria-current={active ? 'true' : undefined}
                className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm transition', active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              >
                {g.label}
              </Link>
            )
          })}
        </nav>
        <div className="scrollbar-none -mx-4 flex shrink-0 items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex shrink-0 rounded-full border border-border p-0.5" role="group" aria-label="Sıralama">
            {(Object.keys(SORTS) as SortKey[]).map((k) => {
              const active = (current.sort ?? 'populer') === k
              return (
                <Link
                  key={k}
                  href={href(current, { sort: k === 'populer' ? undefined : k })}
                  aria-current={active ? 'true' : undefined}
                  className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {SORTS[k].label}
                </Link>
              )
            })}
          </div>
          <Link
            href={href(current, { lang: current.lang === 'tr' ? undefined : 'tr' })}
            aria-pressed={current.lang === 'tr'}
            className={cn(
              'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
              current.lang === 'tr' ? 'border-primary bg-primary/10 text-ink' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('size-1.5 rounded-full', current.lang === 'tr' ? 'bg-primary' : 'bg-muted-foreground/40')} aria-hidden="true" />
            Türkçe
          </Link>
        </div>
      </div>
    </div>
  )
}
