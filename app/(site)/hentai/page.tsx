import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { searchHanime, type HanimeSort } from '@/lib/hanime/catalog'
import { HanimeCard } from '@/components/hentai/hanime-card'
import { HentaiHome } from '@/components/hentai/hentai-home'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Hentai',
  description: 'Yetiskin anime katalogu: trend, yeni ve en begenilenler. Dogrudan sitede izle.',
  robots: { index: false, follow: false },
}

const SORTS: { id: HanimeSort; label: string }[] = [
  { id: 'trending', label: 'Trend' },
  { id: 'new', label: 'Yeni' },
  { id: 'top', label: 'Begeni' },
  { id: 'az', label: 'A-Z' },
]

type SP = Promise<Record<string, string | undefined>>

export const dynamic = 'force-dynamic'

export default async function HentaiPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.sayfa) || 1)
  const filtered = Boolean(sp.q || sp.etiket || sp.studyo || sp.sira || page > 1)

  if (!filtered) return <HentaiHome />

  const href = (next: Record<string, string | null>) => {
    const merged = { q: sp.q ?? null, etiket: sp.etiket ?? null, studyo: sp.studyo ?? null, sira: sp.sira ?? null, ...next }
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const q = p.toString()
    return q ? '/hentai?' + q : '/hentai'
  }

  const result = await searchHanime({
    q: sp.q,
    tag: sp.etiket,
    brand: sp.studyo,
    sort: (sp.sira as HanimeSort | undefined) ?? 'trending',
    page,
  })

  return (
    <div className="ht-theme dark min-h-screen bg-background pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="label-mono text-primary">18+ katalog</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {sp.etiket ?? sp.studyo ?? (sp.q ? '"' + sp.q + '"' : 'Tum')}{' '}
            <span className="accent-serif italic text-muted-foreground">{sp.etiket || sp.studyo || sp.q ? 'sonuclar' : 'kitaplik'}</span>
          </h1>
        </div>

        <form action="/hentai" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card/60 p-1.5 pl-5 transition focus-within:border-primary/60">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Ara..." className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
          <button className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Ara</button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Siralama">
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={href({ sira: s.id })}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  (sp.sira ?? 'trending') === s.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
          <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{result.total.toLocaleString('tr-TR')} sonuc</p>
        </div>

        {result.items.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {result.items.map((v) => (
              <li key={v.slug}><HanimeCard video={v} /></li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-20 text-center">
            <span className="grid size-12 place-items-center rounded-full border border-border bg-card">
              <Search className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">Sonuc yok</p>
              <p className="text-sm text-muted-foreground">Filtreleri gevsetmeyi ya da baska bir etiket denemeyi dene.</p>
            </div>
            <Link href="/hentai" className="rounded-full border border-border px-5 py-2.5 text-sm transition hover:border-primary">
              Filtreleri temizle
            </Link>
          </div>
        )}

        <nav className="flex items-center justify-center gap-3 pt-4" aria-label="Sayfalama">
          {page > 1 && (
            <Link href={href({ sayfa: String(page - 1) })} className="flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm transition hover:border-primary">
              <ArrowLeft className="size-4" /> Onceki
            </Link>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sayfa {page}</span>
          {result.hasNext && (
            <Link href={href({ sayfa: String(page + 1) })} className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}