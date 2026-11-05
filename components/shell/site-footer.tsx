import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FooterThemeLine } from './footer-theme-line'

const COLS = [
  {
    title: 'Keşfet',
    links: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/ara?sort=TRENDING_DESC', label: 'Trend animeler' },
      { href: '/ara?sort=SCORE_DESC', label: 'En yüksek puanlılar' },
      { href: '/takvim', label: 'Yayın takvimi' },
      { href: '/rastgele', label: 'Rastgele anime' },
    ],
  },
  {
    title: 'Hesap',
    links: [
      { href: '/giris', label: 'Giriş yap' },
      { href: '/profil', label: 'Profilim' },
      { href: '/ayarlar', label: 'Ayarlar' },
      { href: '/karsilastir', label: 'Karşılaştır' },
    ],
  },
  {
    title: 'Kaynaklar',
    links: [
      { href: 'https://anilist.co', label: 'AniList', external: true },
      { href: 'https://animethemes.moe', label: 'AnimeThemes', external: true },
      { href: '/admin', label: 'Yönetim paneli' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-card">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-16 sm:px-6 md:pb-10 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <p className="label-mono text-muted-foreground">Anime keşif platformu</p>
            <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Bir sonraki favori animen <span className="accent-serif">burada.</span>
            </h2>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Sytheris; trend listeleri, fragmanlar, karakterler ve seslendirmenlerle anime keşfini tek bir yerde toplar. Veriler AniList üzerinden canlı gelir.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((col) => (
              <div key={col.title} className="flex flex-col gap-4">
                <p className="label-mono text-ink">{col.title}</p>
                <ul className="flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {'external' in l && l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
                          {l.label}
                          <ArrowUpRight className="size-3" />
                        </a>
                      ) : (
                        <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 select-none" aria-hidden="true">
          <p className="bg-gradient-to-b from-foreground/90 to-foreground/0 bg-clip-text text-center text-[22vw] font-bold leading-[0.8] tracking-[-0.06em] text-transparent lg:text-[15rem]">
            SYTHERIS
          </p>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <FooterThemeLine />
          <p>© {new Date().getFullYear()} Sytheris. Anime verileri AniList&apos;e aittir. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}