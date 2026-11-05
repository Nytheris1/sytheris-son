import { AnimeRow } from '@/components/anime/anime-row'
import { GenreExplorer } from '@/components/home/genre-explorer'
import { Hero } from '@/components/home/hero'
import { OnSiteRow } from '@/components/home/on-site-row'
import { TopTen } from '@/components/home/top-ten'
import { WeeklyPick } from '@/components/home/weekly-pick'
import { getAnimeMeta, getHomeData } from '@/lib/anilist'
import { seasonTr } from '@/lib/format'
import { getEpisodeCatalog, getSettings } from '@/lib/site'

export default async function HomePage() {
  const [data, settings, catalog] = await Promise.all([getHomeData(), getSettings(), getEpisodeCatalog().catch(() => [])])
  const featured = settings.featuredId ? await getAnimeMeta(settings.featuredId) : null

  if (!data.hero.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
        <p className="label-mono text-ink">Bağlantı sorunu</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          AniList şu an <span className="accent-serif">yanıt vermiyor</span>
        </h1>
        <p className="leading-relaxed text-muted-foreground">Veri kaynağına ulaşılamadı. Birkaç saniye sonra sayfayı yenilemeyi dene.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-20 pb-10 sm:gap-24">
      <Hero items={data.hero} />
      <TopTen items={data.top} />
      <OnSiteRow catalog={catalog} />
      <WeeklyPick media={featured ?? data.pick} />
      <AnimeRow
        eyebrow={`${seasonTr(data.season)} sezonu`}
        title={`${data.year} sezonunun`}
        accent="en iyileri"
        description="Bu sezon yayınlanan ve en çok ilgi gören yapımlar."
        href={`/ara?season=${data.season}&year=${data.year}`}
        items={data.seasonal}
      />
      <GenreExplorer />
      <AnimeRow eyebrow="Efsaneler" title="Tüm zamanların" accent="zirvesi" description="Topluluğun en yüksek puan verdiği başyapıtlar." href="/ara?sort=SCORE_DESC" items={data.allTime} />
      <AnimeRow eyebrow="Popüler" title="Herkesin izlediği" accent="favoriler" href="/ara?sort=POPULARITY_DESC" items={data.popular} />
      <AnimeRow eyebrow="Yakında" title="Gelecek" accent="yapımlar" description="Henüz yayınlanmamış ama şimdiden merakla beklenenler." href="/ara?status=NOT_YET_RELEASED" items={data.upcoming} />
    </div>
  )
}
