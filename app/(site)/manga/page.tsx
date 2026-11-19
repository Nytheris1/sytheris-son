import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { GENRES, SORTS, getMangaHome, listManga, type SortKey } from '@/lib/manga'
import { MangaCard } from '@/components/manga/manga-card'
import { MangaFilters } from '@/components/manga/manga-filters'
import { MangaHero } from '@/components/manga/manga-hero'
import { MangaRow } from '@/components/manga/manga-row'

export const metadata: Metadata = {
  title: 'Manga',
  description: 'Binlerce manga serisi, Türkçe ve İngilizce bölümleriyle. Tür ve popülerliğe göre keşfet, tarayıcında oku.',
}

type SP = Promise<Record<string, string | undefined>>

export default async function MangaPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = sp.q?.trim().slice(0, 80) || undefined
  const genre = GENRES.some((g) => g.slug === sp.genre) ? sp.genre : undefined
  const sort = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : undefined
  const lang = sp.lang === 'tr' ? ('tr' as const) : undefined
  const page = Math.max(1, Math.min(200, Number(sp.page) || 1))
  const filtered = Boolean(q || genre || sort || lang || page > 1)

  if (!filtered) {
    const home = await getMangaHome()
    return (
      <div className="flex flex-col pb-10">
        <MangaHero stack={home.popular} total={home.total} />
        <MangaFilters current={{}} />
        {home.popular.length === 0 ? (
          <Unavailable />
        ) : (
          <div className="flex flex-col gap-20 pt-14 sm:gap-24">
            <MangaRow eyebrow="Türkçe" title="Türkçe" accent="okunabilenler" description="Çevirmen ekiplerin Türkçeye kazandırdığı seriler." href="/manga?lang=tr" items={home.turkish} />
            <TopShelf items={home.top} />
            <MangaRow eyebrow="Taze" title="Yeni bölüm" accent="gelenler" description="Son saatlerde yeni bölümü yüklenen seriler." href="/manga?sort=guncel" items={home.latest} />
            <MangaRow eyebrow="Popüler" title="Herkesin" accent="okudukları" href="/manga?sort=populer&page=1" items={home.popular} />
          </div>
        )}
      </div>
    )
  }

  const result = await listManga({ q, genre, sort, lang, page })
  const genreLabel = GENRES.find((g) => g.slug === genre)?.label
  const heading = q ? `“${q}”` : genreLabel ?? (lang ? 'Türkçe seriler' : SORTS[sort ?? 'populer'].label)
  const pageHref = (n: number) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ q, genre, sort, lang })) if (v) p.set(k, v)
    if (n > 1) p.set('page', String(n))
    return `/manga?${p.toString()}`
  }

  return (
    <div className="flex flex-col pb-10">
      <MangaHero stack={result.items} total={result.total} q={q} />
      <MangaFilters current={{ q, genre, sort, lang }} />
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pt-12 sm:px-6 lg:px-10" aria-labelledby="mg-results">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <h2 id="mg-results" className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {heading}
          </h2>
          <p className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{result.total.toLocaleString('tr-TR')} sonuç</p>
        </div>
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-2xl font-semibold tracking-tight">Bu rafta bir şey yok</p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Başka bir isim dene ya da filtreleri gevşet.</p>
            <Link href="/manga" className="mt-2 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted">
              Kataloğa dön
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {result.items.map((m, i) => (
              <li key={m.id}>
                <MangaCard manga={m} priority={i < 6} />
              </li>
            ))}
          </ul>
        )}
        {result.pages > 1 && (
          <nav className="flex items-center justify-center gap-3 pt-6" aria-label="Sayfalar">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted">
                <ArrowLeft className="size-4" aria-hidden="true" /> Önceki
              </Link>
            )}
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {page} / {Math.min(result.pages, 200)}
            </span>
            {page < Math.min(result.pages, 200) && (
              <Link href={pageHref(page + 1)} className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background transition hover:opacity-90">
                Sonraki <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  )
}

function TopShelf({ items }: { items: Awaited<ReturnType<typeof getMangaHome>>['top'] }) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="mg-top">
      <div className="flex flex-col gap-3">
        <p className="label-mono flex items-center gap-3 text-ink">
          <span className="h-px w-8 bg-primary" />
          Zirve rafı
        </p>
        <h2 id="mg-top" className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
          Okurların <span className="accent-serif">en sevdikleri</span>
        </h2>
      </div>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((m, i) => (
          <li key={m.id}>
            <MangaCard manga={m} rank={i + 1} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function Unavailable() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-28 text-center">
      <p className="label-mono text-ink">Bağlantı sorunu</p>
      <h2 className="text-3xl font-semibold tracking-tight">
        Manga kaynağı <span className="accent-serif">şu an sessiz</span>
      </h2>
      <p className="leading-relaxed text-muted-foreground">MangaDex’e ulaşılamadı. Birkaç saniye sonra sayfayı yenilemeyi dene.</p>
    </div>
  )
}
