import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DownloadPanel } from '@/components/download/download-panel'
import { downloadsEnabled } from '@/lib/project-archive'

/*
 * Hidden page: nothing on the site links here and search engines are told to skip it.
 * To remove it for good run `node indir-kaldir.mjs`, or delete these paths by hand — nothing else depends on them:
 *   app/indir/  ·  app/api/indir/  ·  components/download/  ·  lib/project-archive.ts
 * To switch it off without deleting, set INDIR_DISABLED=1 in the project's environment.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projeyi indir',
  description: 'Sytheris kaynak kodunun tamamını tek tıkla ZIP olarak indir.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

const NOTES = [
  { title: 'Neler dahil', body: 'Uygulama, bileşenler, stiller, API rotaları, betikler ve public klasörü. node_modules, .next ve .env arşive girmez.' },
  { title: 'Neden 401 vermez', body: 'Dosyalar, açık olan bu sayfanın kendi adresine giden sunucu eylemiyle 2 MB’lık parçalar hâlinde çekilir ve ZIP tarayıcında oluşturulur; ayrı adres, çerez ya da oturum gerekmez. Olmazsa akış API’si denenir.' },
  { title: 'Gizli sayfa', body: 'Sitede hiçbir yerden bağlantı verilmez ve arama motorlarına kapalıdır; yalnızca adresi bilen ulaşır.' },
  { title: 'Kaldırmak için', body: 'node indir-kaldir.mjs sayfayı, API’yi ve yardımcı dosyaları tek seferde siler. Geçici kapatmak için INDIR_DISABLED=1.' },
]

export default function DownloadPage() {
  if (!downloadsEnabled()) notFound()

  return (
    <main className="dark flex min-h-dvh flex-col bg-scrim text-foreground">
      <header className="flex items-center justify-between border-b border-foreground/10 px-5 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-sm text-foreground/60 transition hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Siteye dön
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/45">/indir</span>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Kaynak kod</p>
            <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
              Sytheris’in tamamı, <span className="font-serif font-normal italic tracking-normal">tek dosyada</span>.
            </h1>
            <p className="max-w-md text-pretty leading-relaxed text-foreground/60">
              Butona bas, proje parça parça paketlenip tarayıcında birleştirilsin. Şifre, hesap ya da yetki gerekmez.
            </p>
          </div>

          <dl className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/10">
            {NOTES.map((n) => (
              <div key={n.title} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="text-sm font-semibold">{n.title}</dt>
                <dd className="text-sm leading-relaxed text-foreground/55">{n.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <DownloadPanel />
      </div>
    </main>
  )
}
