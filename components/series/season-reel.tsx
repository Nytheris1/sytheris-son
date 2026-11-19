import type { SeriesSeason } from '@/lib/series'
import { ScrollRow } from '@/components/anime/scroll-row'

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) : null)

/** Seasons as a reel of frames: season art, a giant outlined season numeral, air dates and episode count. */
export function SeasonReel({ seasons, fallback }: { seasons: SeriesSeason[]; fallback: string }) {
  if (!seasons.length) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sezon bilgisi bulunamadı.</p>
  }
  return (
    <div className="dark hx-filmstrip -mx-4 py-7 text-foreground sm:mx-0 sm:rounded-2xl">
      <div className="px-4 sm:px-6">
        <ScrollRow label="Sezonlar">
          {seasons.map((s) => {
            const dates = [fmt(s.premiere), fmt(s.end)].filter(Boolean)
            return (
              <article key={s.number} className="group relative flex w-[46vw] shrink-0 snap-start flex-col gap-3 sm:w-[200px]">
                <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-primary/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image || fallback || '/placeholder.svg'} alt="" loading="lazy" className={s.image ? 'size-full object-cover' : 'size-full object-cover opacity-40 blur-sm'} />
                  <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/30 to-transparent" aria-hidden="true" />
                  <span className="cine-numeral absolute -bottom-3 left-2 font-sans text-[7rem] font-black leading-none tracking-[-0.08em]" aria-hidden="true">
                    {s.number}
                  </span>
                  {s.episodes ? (
                    <span className="absolute right-2 top-2 rounded-full bg-scrim/75 px-2.5 py-1 font-mono text-[10px] font-semibold text-on-scrim backdrop-blur">{s.episodes} bölüm</span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-sm font-semibold">{s.number}. Sezon</h3>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">{dates.join(' – ') || 'Tarih bilinmiyor'}</p>
                </div>
              </article>
            )
          })}
        </ScrollRow>
      </div>
    </div>
  )
}
