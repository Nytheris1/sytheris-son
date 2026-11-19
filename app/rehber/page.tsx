import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Download, Lock, Trash2, Wrench } from 'lucide-react'
import { CodeBlock } from '@/components/guide/code-block'
import { MascotTester } from '@/components/guide/mascot-tester'
import { MASCOT } from '@/components/mascot/mascot-config'
import { PROFILE } from '@/components/portfolio/data'

/*
 * GEÇİCİ REHBER — işin bitince sil:
 *   app/rehber/   ve   components/guide/
 * Başka hiçbir dosya bunlara bağlı değil.
 */

export const metadata: Metadata = {
  title: 'Rehber',
  robots: { index: false, follow: false, nocache: true },
}

const TOC = [
  { id: 'maskot', label: 'Maskotu değiştir' },
  { id: 'portfolyo', label: 'Portfolyoyu değiştir' },
  { id: 'ekranlar', label: 'Kilit ve bakım ekranı' },
  { id: 'indir', label: 'Projeyi indir' },
  { id: 'sil', label: 'Bu rehberi sil' },
]

const MOODS: { id: keyof typeof MASCOT.images; label: string; where: string }[] = [
  { id: 'wave', label: 'El sallayan', where: 'Ana sayfa, giriş, tanıtım' },
  { id: 'lost', label: 'Kaybolmuş', where: '404 ve hata sayfaları' },
  { id: 'secret', label: 'Sır veren', where: 'Gizli paneller' },
  { id: 'think', label: 'Düşünen', where: 'Boş durumlar, asistan' },
  { id: 'portrait', label: 'Portre', where: 'Tanıtım filmi' },
  { id: 'avatar', label: 'Avatar', where: 'Yorumlar, footer, yuvarlak alanlar' },
]

const PORTFOLIO_FIELDS: [string, string][] = [
  ['name', 'Sayfa başlığındaki ismin.'],
  ['photo', 'Polaroid fotoğrafın. public/folio/ içine koyup yolunu yaz.'],
  ['photoNoteLeft / photoNoteRight', 'Fotoğrafın altındaki el yazısı notlar.'],
  ['ringWords', 'Fotoğrafın yanında dönen yuvarlak yazının kelimeleri.'],
  ['hello', 'Dev başlık (ör. SELAM!!). Ünlemler otomatik pembe olur.'],
  ['intro / statements', 'Tanıtım cümlesi ve kalın girişli paragraflar.'],
  ['email / phone / links', 'Alttaki hap şeklindeki iletişim butonları. Boş bırakılan gizlenir.'],
  ['WORKS', 'İşlerin: başlık, tür, yıl, görsel, açıklama ve rolün.'],
  ['SKILLS / TIMELINE', '“Neler yaparım” listesi ve zaman çizelgesi.'],
]

function Section({ id, step, title, accent, children }: { id: string; step: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-24 flex-col gap-6 border-t border-border pt-12">
      <div className="flex flex-col gap-2">
        <p className="label-mono text-ink">{step}</p>
        <h2 id={`${id}-t`} className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title} <span className="accent-serif">{accent}</span>
        </h2>
      </div>
      {children}
    </section>
  )
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((it, i) => (
        <li key={i} className="flex gap-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">{i + 1}</span>
          <div className="pt-1 text-pretty leading-relaxed">{it}</div>
        </li>
      ))}
    </ol>
  )
}

const code = (s: string) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{s}</code>

export default function GuidePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Siteye dön">
            <ArrowLeft className="size-4 text-muted-foreground" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">SYTHERIS</span>
          </Link>
          <span className="rounded-full border border-dashed border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Geçici sayfa · /rehber</span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10">
        <nav aria-label="Rehber bölümleri" className="hidden lg:block">
          <ul className="sticky top-28 flex flex-col gap-1 border-l border-border">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex min-w-0 flex-col gap-14">
          <div className="flex flex-col gap-4">
            <p className="label-mono text-ink">Kendin değiştir</p>
            <h1 className="text-balance text-5xl font-bold tracking-[-0.04em] sm:text-6xl">
              Kısa bir <span className="accent-serif">rehber.</span>
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Maskotu ve portfolyoyu kod yazmadan değiştirebilmen için her şey tek dosyalarda toplandı. Bu sayfa sitede hiçbir yerden bağlanmaz; işin bitince silebilirsin.
            </p>
          </div>

          <Section id="maskot" step="Bölüm 1" title="Maskotu" accent="değiştir">
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              Şu anki maskot <strong className="font-semibold text-foreground">{MASCOT.name}</strong>. Altı farklı hâli var; her biri sitede farklı yerlerde görünür. Hepsinin yolu {code('components/mascot/mascot-config.ts')} dosyasında.
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MOODS.map((m) => (
                <li key={m.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  <span className="relative block h-40 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={MASCOT.images[m.id] || '/placeholder.svg'} alt={`${MASCOT.name} — ${m.label}`} className="size-full object-contain object-bottom" loading="lazy" />
                  </span>
                  <span className="flex flex-col gap-0.5 p-3">
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.where}</span>
                    <span className="mt-1 truncate font-mono text-[10px] text-muted-foreground">public{MASCOT.images[m.id]}</span>
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="pt-2 text-xl font-semibold tracking-tight">En kolay yol: dosyaların üzerine yaz</h3>
            <Steps
              items={[
                <>Her hâl için bir görsel hazırla. <strong className="font-semibold">Şeffaf arka planlı PNG veya WebP</strong>, dikey (yaklaşık 3:4) ve en az 900px yüksekliğinde olsun. Avatar için kare (1:1) bir yüz kırpımı kullan.</>,
                <>Aşağıdaki deneme alanında görselini seçip sitede nasıl duracağına bak.</>,
                <>Projede {code('public/mascot/')} klasörünü aç ve görselleri <strong className="font-semibold">aynı isimlerle</strong> ({code('syra-wave.webp')}, {code('syra-avatar.webp')}…) eskilerinin üzerine kaydet. Başka hiçbir şey yapmana gerek yok.</>,
                <>Maskotun adını değiştirmek için {code('mascot-config.ts')} içindeki {code(`name: '${MASCOT.name}'`)} satırını düzenle.</>,
              ]}
            />

            <MascotTester />

            <h3 className="pt-2 text-xl font-semibold tracking-tight">Farklı isim, format veya adres kullanmak istersen</h3>
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">Görsellerin farklı isimde (ör. PNG) ya da bir internet adresindeyse yolları bu dosyada değiştir:</p>
            <CodeBlock
              file="components/mascot/mascot-config.ts"
              code={`export const MASCOT = {
  name: 'Yeni İsim',
  images: {
    wave: '/mascot/yeni-el-sallama.png',
    lost: '/mascot/yeni-kayip.png',
    secret: '/mascot/yeni-sir.png',
    think: '/mascot/yeni-dusunen.png',
    portrait: '/mascot/yeni-portre.png',
    avatar: '/mascot/yeni-avatar.png', // kare olmalı
  },
  // …
}`}
            />
          </Section>

          <Section id="portfolyo" step="Bölüm 2" title="Portfolyoyu" accent="değiştir">
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {code('/portfolyo')} sayfasındaki tüm metinler, fotoğraf ve işler {code('components/portfolio/data.ts')} dosyasından gelir. Şu an yer tutucu bir fotoğraf ve örnek işler var.
            </p>
            <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
              <div className="w-fit -rotate-3 bg-[oklch(0.95_0.012_85)] p-2.5 pb-8 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PROFILE.photo || '/placeholder.svg'} alt="Şu anki portfolyo fotoğrafı" className="aspect-square w-44 object-cover grayscale" />
              </div>
              <dl className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
                {PORTFOLIO_FIELDS.map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                    <dt className="font-mono text-[13px] text-ink">{k}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Steps
              items={[
                <>Kendi fotoğrafını {code('public/folio/me.webp')} adıyla kaydet (üzerine yaz) ya da farklı isimle koyup {code('photo')} alanına yolunu yaz. Fotoğraf otomatik siyah-beyaz yapılır.</>,
                <>{code('data.ts')} içinde isim, yaş notu, şehir, başlık ve paragrafları düzenle.</>,
                <>İş görsellerini {code('public/folio/')} içine koy ve {code('WORKS')} listesini güncelle. 4:3 oranlı görseller en iyi sonucu verir.</>,
              ]}
            />
            <CodeBlock
              file="components/portfolio/data.ts"
              code={`export const PROFILE = {
  name: '${PROFILE.name}',
  photo: '/folio/me.webp',
  photoNoteLeft: '${PROFILE.photoNoteLeft}',
  photoNoteRight: '${PROFILE.photoNoteRight}',
  hello: '${PROFILE.hello}',
  email: '${PROFILE.email}',
  // …
}`}
            />
            <Link href="/portfolyo" className="group flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground">
              Portfolyoyu aç <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Section>

          <Section id="ekranlar" step="Bölüm 3" title="Kilit ve bakım" accent="ekranları">
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              Site {code('SITE_ACCESS_KEY')} (ya da {code('ADMIN_PASSWORD')}) tanımlıyken kilitlidir; bakım modu kontrol merkezinden açılır. İkisini de buradan, siteyi kapatmadan önizleyebilirsin. Bakım ekranındaki geri sayım için “Tahmini dönüş” alanına {code('2026-12-01T18:00')} gibi bir tarih yaz.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/rehber/onizleme/kapi" className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/30">
                <span className="flex items-center gap-3">
                  <Lock className="size-5 text-ink" />
                  <span className="flex flex-col">
                    <span className="font-semibold">Kilit ekranı</span>
                    <span className="text-sm text-muted-foreground">Sisli geçit, erişim anahtarı</span>
                  </span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
              <Link href="/rehber/onizleme/bakim" className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/30">
                <span className="flex items-center gap-3">
                  <Wrench className="size-5 text-ink" />
                  <span className="flex flex-col">
                    <span className="font-semibold">Bakım ekranı</span>
                    <span className="text-sm text-muted-foreground">Uyuyan ejderha, geri sayım</span>
                  </span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
            </div>
          </Section>

          <Section id="indir" step="Bölüm 4" title="Projeyi" accent="indir">
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {code('/indir')} sayfası projenin tamamını giriş istemeden ZIP olarak indirir; {code('node_modules')}, {code('.next')} ve {code('.env')} dahil edilmez. Sayfa gizlidir ve kilit açıkken bile erişilebilir.
            </p>
            <Link href="/indir" className="group flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              <Download className="size-4" /> İndirme sayfasına git
            </Link>
          </Section>

          <Section id="sil" step="Bölüm 5" title="Bu rehberi" accent="sil">
            <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">İşin bittiğinde bu iki klasörü silmen yeterli. Sitede başka hiçbir dosya bunlara bağlı değil.</p>
            <ul className="flex flex-col gap-2">
              {['app/rehber/', 'components/guide/'].map((p) => (
                <li key={p} className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 font-mono text-sm">
                  <Trash2 className="size-4 text-destructive" /> {p}
                </li>
              ))}
            </ul>
          </Section>
        </main>
      </div>
    </div>
  )
}
