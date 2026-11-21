import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FooterThemeLine } from './footer-theme-line'
import { Mascot } from '@/components/mascot/mascot'
import type { ContentMode } from '@/lib/content-mode-shared'

const COLS = [
  {
    title: 'Keşfet',
    links: [
      { href: '/ara?sort=TRENDING_DESC', label: 'Trend animeler' },
      { href: '/ara?sort=SCORE_DESC', label: 'En yüksek puanlılar' },
      { href: '/takvim', label: 'Yayın takvimi' },
      { href: '/rastgele', label: 'Rastgele öneri' },
      { href: '/korku', label: 'Korku Filmleri' },
      { href: '/karsilastir', label: 'Karşılaştır' },
    ],
  },
  {
    title: 'Hesabın',
    links: [
      { href: '/kutuphane', label: 'Kütüphanem' },
      { href: '/atolye', label: 'Çizim Atölyesi' },
      { href: '/ayarlar', label: 'Ayarlar' },
      { href: '/abonelik', label: 'Sytheris+' },
      { href: '/hosgeldin', label: 'Tanıtım' },
      { href: '/portfolyo', label: 'Portfolyo' },
    ],
  },
  {
    title: 'Kaynaklar',
    links: [
      { href: 'https://anilist.co', label: 'AniList', external: true },
      { href: 'https://animethemes.moe', label: 'AnimeThemes', external: true },
    ],
  },
]

const CINE_COLS = [
  {
    title: 'Sinema',
    links: [
      { href: '/filmler', label: 'Tüm filmler' },
      { href: '/diziler', label: 'Tüm diziler' },
      { href: '/diziler?sira=puan', label: 'En yüksek puanlı diziler' },
      { href: '/rastgele', label: 'Rastgele seans' },
      { href: '/korku', label: 'Gece Sineması' },
    ],
  },
  {
    title: 'Türler',
    links: [
      { href: '/filmler?tur=aksiyon', label: 'Aksiyon' },
      { href: '/filmler?tur=bilimkurgu', label: 'Bilim Kurgu' },
      { href: '/filmler?tur=gerilim', label: 'Gerilim' },
      { href: '/diziler?tur=suc', label: 'Suç dizileri' },
      { href: '/filmler?tur=klasik', label: 'Klasikler' },
    ],
  },
  {
    title: 'Salon',
    links: [
      { href: '/kutuphane', label: 'Kütüphanem' },
      { href: '/atolye', label: 'Galeri' },
      { href: '/ayarlar?tab=icerik', label: 'Anime moduna dön' },
      { href: 'https://www.tvmaze.com', label: 'TVmaze', external: true },
      { href: 'https://www.apple.com/tr/apple-tv-app/', label: 'Apple TV', external: true },
    ],
  },
]

const HENTAI_COLS = [
  {
    title: 'Kütüphane',
    links: [
      { href: '/hentai', label: 'Hentailer' },
      { href: '/hentai/doujin', label: 'Doujinshi' },
      { href: '/porno', label: 'Pornolar' },
      { href: '/galeri', label: 'Rule34 galerisi' },
    ],
  },
  {
    title: 'Keşif',
    links: [
      { href: '/rastgele', label: 'Rastgele öner' },
      { href: '/kutuphane', label: 'Kütüphanem' },
      { href: '/takvim', label: 'Yayın takvimi' },
      { href: '/ara', label: 'Anime kataloğu' },
    ],
  },
  {
    title: 'Modlar',
    links: [
      { href: '/ayarlar?tab=icerik', label: 'Mod seç' },
      { href: '/filmler', label: 'Sinema modu' },
      { href: '/manga', label: 'Manga' },
      { href: 'https://hanime.tv', label: 'hanime.tv', external: true },
      { href: 'https://rule34.us', label: 'rule34.us', external: true },
    ],
  },
]

function FooterLinks({ cols }: { cols: { title: string; links: { href: string; label: string; external?: boolean }[] }[] }) {
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      {cols.map((col) => (
        <div key={col.title} className="flex flex-col gap-4">
          <p className="label-mono text-ink">{col.title}</p>
          <ul className="flex flex-col gap-3">
            {col.links.map((l) => (
              <li key={l.href}>
                {l.external ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
                    {l.label}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
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
  )
}

function CinemaFooter() {
  return (
    <footer className="cine dark relative mt-24 overflow-hidden border-t border-border bg-scrim text-foreground">
      <span className="cine-bulbs absolute inset-x-0 top-0 h-3" aria-hidden="true" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-16 sm:px-6 md:pb-10 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="flex flex-col gap-6">
            <p className="label-mono flex items-center gap-3 text-ink">
              <span className="h-px w-8 bg-primary" /> Sytheris Sinema
            </p>
            <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Işıklar söndü, <span className="accent-serif">seans başlıyor.</span>
            </h2>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Türkiye listelerinden filmler, dünyanın konuştuğu diziler ve gecenin kısa korkuları — hepsi tek salonda.
            </p>
            <div className="cine-ticket flex w-fit items-stretch rounded-lg font-mono text-[10px] uppercase tracking-[0.2em]" style={{ '--stub': 'calc(100% - 5rem)' } as React.CSSProperties}>
              <span className="flex flex-col justify-center gap-1 px-4 py-2.5">
                <span className="text-foreground/50">Salon</span>
                <span className="text-foreground/90">Sytheris · 01</span>
              </span>
              <span className="my-2 w-px bg-foreground/15" aria-hidden="true" />
              <span className="flex flex-col justify-center gap-1 px-4 py-2.5">
                <span className="text-foreground/50">Sıra</span>
                <span className="text-foreground/90">Ön sıra</span>
              </span>
              <span className="my-1 border-l border-dashed border-foreground/25" aria-hidden="true" />
              <span className="flex w-20 flex-col items-center justify-center gap-1 py-2.5 text-ink">
                <span className="text-foreground/50">Yıl</span>
                <span className="text-sm font-semibold tracking-[0.1em]">{new Date().getFullYear()}</span>
              </span>
            </div>
          </div>
          <FooterLinks cols={CINE_COLS} />
        </div>

        <div className="relative mt-16 select-none" aria-hidden="true">
          <p className="text-center text-[20vw] font-bold leading-[0.8] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_color-mix(in_oklch,var(--primary)_55%,transparent)] lg:text-[14rem]">SİNEMA</p>
          <span className="cine-bulbs absolute inset-x-[8%] -bottom-3 h-3" />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>Film verileri Apple iTunes, dizi verileri TVmaze üzerinden canlı gelir.</p>
          <p>© {new Date().getFullYear()} Sytheris Sinema. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}

function HentaiFooter() {
  return (
    <footer className="ht-theme relative mt-24 overflow-hidden border-t border-border bg-card">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[60%] -translate-x-1/2 rounded-full blur-[80px]"
        style={{ background: 'oklch(0.68 0.22 352 / 0.12)' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-28 pt-16 sm:px-6 md:pb-10 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <p className="label-mono flex items-center gap-2.5 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Hentai arşivi
              <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] tracking-[0.14em] text-muted-foreground">18+</span>
            </p>
            <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Işıklar kısık, <span className="accent-serif">sekmeler kapalı.</span>
            </h2>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Hentai arşivi, doujinshi rafı, pornolar ve Rule34 galerisi tek yerde; hepsi gömülü oynatıcıyla. Veriler hanime.tv, nhentai, Pornhub, XVideos ve rule34 üzerinden canlı gelir.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Hentai', 'Doujinshi', 'Porno', 'Rule34'].map((t) => (
                <span key={t} className="ht-chip rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <FooterLinks cols={HENTAI_COLS} />
        </div>

        <div className="mt-16 select-none" aria-hidden="true">
          <p className="bg-gradient-to-b from-primary/85 to-transparent bg-clip-text text-center text-[22vw] font-bold leading-[0.8] tracking-[-0.06em] text-transparent lg:text-[15rem]">
            HENTAI
          </p>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <FooterThemeLine />
          <p>© {new Date().getFullYear()} Sytheris. 18+ içerik. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}

export function SiteFooter({ mode = 'anime' }: { mode?: ContentMode }) {
  if (mode === 'film') return <CinemaFooter />
  if (mode === 'hentai') return <HentaiFooter />
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-card">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-16 sm:px-6 md:pb-10 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex items-start gap-5">
            <Mascot className="hidden size-28 shrink-0 sm:block" pose="bust" />
            <div className="flex flex-col gap-5">
              <p className="label-mono text-muted-foreground">Anime keşif platformu</p>
              <h2 className="max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Bir sonraki favori animen <span className="accent-serif">burada.</span>
              </h2>
              <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
                Sytheris; trend listeleri, fragmanlar, karakterler ve kişisel kütüphanenle anime keşfini tek bir yerde toplar. Veriler AniList üzerinden canlı gelir.
              </p>
            </div>
          </div>
          <FooterLinks cols={COLS} />
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