import Link from 'next/link'
import { Clapperboard } from 'lucide-react'
import { getFilmHome, type Film } from '@/lib/films'
import { getSeries, getSeriesHome, type SeriesDetail } from '@/lib/series'
import { translate } from '@/lib/translate'
import { HorrorTeaser } from '@/components/home/horror-teaser'
import { SeriesRow } from '@/components/series/series-card'
import { SeriesSpotlight } from '@/components/series/series-spotlight'
import { CinemaMarquee } from './cinema-marquee'
import { StarFaces } from './star-faces'
import { FilmRow } from './film-card'
import { FilmGenres } from './film-genres'
import { FilmHero } from './film-hero'
import { FilmTopTen } from './film-top-ten'

async function heroSlides(top: Film[]) {
  const head = top.filter((f) => f.poster).slice(0, 5)
  const translated = await Promise.all(head.map((f) => (f.summary ? translate(f.summary, 'tr').catch(() => null) : null)))
  return head.map((f, i) => ({ ...f, summary: translated[i] || f.summary }))
}

export async function FilmHome() {
  const [data, series] = await Promise.all([getFilmHome(), getSeriesHome()])
  const [slides, spotlight] = await Promise.all([
    heroSlides(data.top),
    Promise.all(series.popular.slice(0, 4).map((s) => getSeries(s.id))).then((list) => list.filter((s): s is SeriesDetail => Boolean(s))),
  ])

  if (!data.top.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
        <Clapperboard className="size-8 text-ink" aria-hidden="true" />
        <h1 className="text-4xl font-semibold tracking-tight">
          Film listesi <span className="accent-serif">yüklenemedi</span>
        </h1>
        <p className="leading-relaxed text-muted-foreground">Film kataloğuna şu an ulaşılamıyor. Birkaç saniye sonra yenile ya da anime moduna dön.</p>
        <Link href="/ayarlar?tab=icerik" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
          İçerik modunu değiştir
        </Link>
      </div>
    )
  }

  const used = new Set<string>()
  const pick = (...lists: (Film | undefined)[][]) => {
    for (const list of lists) {
      const hit = list.find((f) => f && (f.posterLg || f.poster) && !used.has(f.id))
      if (hit) {
        used.add(hit.id)
        return hit
      }
    }
    return undefined
  }
  const covers = {
    aksiyon: pick(data.action),
    bilimkurgu: pick(data.scifi),
    gerilim: pick(data.thriller),
    dram: pick(data.drama),
    komedi: pick(data.comedy),
    korku: pick(data.horror, data.thriller),
    romantik: pick(data.top.filter((f) => f.genre === 'Romance'), data.drama),
    aile: pick(data.top.filter((f) => f.genre === 'Kids & Family'), data.comedy, data.classics),
  }

  return (
    <div className="cine dark flex flex-col gap-20 pb-24 sm:gap-24">
      <div className="flex flex-col">
        <FilmHero items={slides} />
        <CinemaMarquee items={data.top.slice(5)} />
      </div>
      <FilmTopTen items={data.top} />
      <SeriesSpotlight items={spotlight} />
      <StarFaces series={spotlight} />
      <FilmRow eyebrow="Aksiyon & Macera" title="Nabzı" accent="yükseltenler" href="/filmler?tur=aksiyon" items={data.action} />
      <SeriesRow eyebrow="Diziler · Popüler" title="Herkesin" accent="izlediği diziler" href="/diziler" items={series.popular.slice(4)} />
      <FilmRow eyebrow="Bilim Kurgu & Fantastik" title="Başka" accent="dünyalar" href="/filmler?tur=bilimkurgu" items={data.scifi} />
      <FilmGenres covers={covers} />
      <FilmRow eyebrow="Gerilim" title="Nefesini" accent="tut" href="/filmler?tur=gerilim" items={data.thriller} />
      <SeriesRow eyebrow="Diziler · Suç" title="Dosyası" accent="kapanmayanlar" href="/diziler?tur=suc" items={series.crime} />
      <HorrorTeaser />
      <FilmRow eyebrow="Dram" title="İnsanı anlatan" accent="hikâyeler" href="/filmler?tur=dram" items={data.drama} />
      <SeriesRow eyebrow="Diziler · En yüksek puan" title="Puanı" accent="tavan yapanlar" href="/diziler?sira=puan" items={series.topRated} />
      <FilmRow eyebrow="Komedi" title="Kötü günlere" accent="ilaç" href="/filmler?tur=komedi" items={data.comedy} />
      <FilmRow eyebrow="Korku" title="Işıkları" accent="kapatma" href="/filmler?tur=korku" items={data.horror} />
      <FilmRow eyebrow="Klasikler" title="Sinemanın" accent="taşları" description="Zamana direnen, her izleyişte yeniden keşfedilen filmler." href="/filmler?tur=klasik" items={data.classics} />
    </div>
  )
}
