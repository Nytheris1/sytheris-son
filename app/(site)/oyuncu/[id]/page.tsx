import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUpRight, UserRound } from 'lucide-react'
import { ageOf, getPerson, type PersonCredit } from '@/lib/people'
import { ExpandableText } from '@/components/anime/expandable-text'
import { CineHeading } from '@/components/cine/cast-credits'
import { ActorFilmography } from '@/components/person/actor-filmography'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const p = await getPerson(id)
  if (!p) return { title: 'Oyuncu bulunamadı' }
  return {
    title: `${p.name} — Oyuncu`,
    description: (p.bio ?? p.description ?? `${p.name} filmografisi ve canlandırdığı karakterler.`).slice(0, 160),
    openGraph: { title: p.name, images: p.image ? [p.image] : [] },
  }
}

const dateTr = (d: string | null) => (d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null)

function SignatureRole({ credit }: { credit: PersonCredit }) {
  const inner = (
    <>
      <span className="relative block aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1 group-hover:ring-primary/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={credit.poster || '/placeholder.svg'} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/50 to-transparent" aria-hidden="true" />
        <span className="cine-card-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-on-scrim">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">Rolü</span>
          <span className="text-balance font-serif text-2xl italic leading-tight">{credit.character}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-1 text-sm font-semibold transition group-hover:text-ink">{credit.title}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {credit.kind === 'film' ? 'Film' : 'Dizi'}
          {credit.year ? ` · ${credit.year}` : ''}
        </span>
      </span>
    </>
  )
  return credit.href ? (
    <Link href={credit.href} className="group flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {inner}
    </Link>
  ) : (
    <div className="group flex flex-col gap-3">{inner}</div>
  )
}

export default async function ActorPage({ params }: Props) {
  const { id } = await params
  const p = await getPerson(id)
  if (!p) notFound()

  const films = p.credits.filter((c) => c.kind === 'film').length
  const series = p.credits.length - films
  const years = p.credits.map((c) => c.year).filter((y): y is number => Boolean(y))
  const firstYear = years.length ? Math.min(...years) : null
  const age = ageOf(p.birth, p.death)
  const signature = p.credits.filter((c) => c.character && c.poster).sort((a, b) => Number(Boolean(b.href)) - Number(Boolean(a.href))).slice(0, 8)

  const facts = [
    p.birth && { label: 'Doğum', value: dateTr(p.birth)! },
    p.death && { label: 'Ölüm', value: dateTr(p.death)! },
    age !== null && { label: p.death ? 'Yaşadı' : 'Yaş', value: `${age}` },
    (p.birthPlace || p.country) && { label: 'Memleket', value: [p.birthPlace, p.country].filter(Boolean).join(', ') },
  ].filter(Boolean) as { label: string; value: string }[]

  const stats = [
    ['Film', films ? String(films) : '—'],
    ['Dizi', series ? String(series) : '—'],
    ['İlk rol', firstYear ? String(firstYear) : '—'],
    ['Kariyer', firstYear ? `${new Date().getFullYear() - firstYear} yıl` : '—'],
  ]

  return (
    <div className="cine dark flex flex-col gap-24 pb-24">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        {p.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-35 blur-3xl saturate-125" />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--scrim)_0%,color-mix(in_oklch,var(--scrim)_80%,transparent)_55%,color-mix(in_oklch,var(--scrim)_40%,transparent)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-page to-transparent" aria-hidden="true" />
        <div className="cine-beam absolute inset-0 -z-10" aria-hidden="true" />
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
        <span className="cine-letterbox top-0" aria-hidden="true" />
        <span className="cine-letterbox bottom-0" aria-hidden="true" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
          <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/60 transition hover:text-primary">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Sinema
          </Link>

          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
            <div className="relative mx-auto w-full max-w-[300px] px-6 lg:max-w-none">
              <span className="cine-bulbs-y absolute inset-y-2 left-0 w-4" aria-hidden="true" />
              <span className="cine-bulbs-y absolute inset-y-2 right-0 w-4" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem_2rem_0.5rem_0.5rem] bg-muted shadow-[0_0_90px_-25px_var(--primary)] ring-1 ring-primary/30">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={`${p.name} portresi`} className="aspect-[3/4] w-full object-cover object-top" />
                ) : (
                  <div className="grid aspect-[3/4] w-full place-items-center text-muted-foreground">
                    <UserRound className="size-16" aria-hidden="true" />
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-scrim/80 to-transparent" aria-hidden="true" />
                <span className="absolute bottom-3 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.36em] text-on-scrim/70">Kulis</span>
              </div>
            </div>

            <div className="flex flex-col gap-7">
              <p className="label-mono flex items-center gap-3 text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden="true" />
                Oyuncu{p.country ? <span className="text-foreground/50">{p.country}</span> : null}
              </p>
              <h1 className="text-balance text-5xl font-bold leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">{p.name}</h1>
              {p.description && <p className="max-w-2xl text-pretty font-serif text-xl italic leading-relaxed text-foreground/80 first-letter:uppercase sm:text-2xl">{p.description}</p>}

              {facts.length > 0 && (
                <dl className="cine-ticket flex w-fit max-w-full flex-wrap items-stretch rounded-lg font-mono text-[10px] uppercase tracking-[0.2em]" style={{ '--stub': 'calc(100% - 5.5rem)' } as React.CSSProperties}>
                  {facts.map((f, i) => (
                    <div key={f.label} className="flex items-stretch">
                      {i > 0 && <span className="my-2.5 w-px bg-foreground/15" aria-hidden="true" />}
                      <div className="flex flex-col justify-center gap-1.5 px-4 py-3">
                        <dt className="text-foreground/50">{f.label}</dt>
                        <dd className="max-w-[16rem] truncate text-[11px] text-foreground/90">{f.value}</dd>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-stretch">
                    <span className="my-1 border-l border-dashed border-foreground/25" aria-hidden="true" />
                    <div className="flex w-[5.5rem] flex-col items-center justify-center gap-1.5 py-3 text-primary">
                      <dt className="text-foreground/50">Yapım</dt>
                      <dd className="text-base font-semibold tracking-[0.06em]">{p.credits.length}</dd>
                    </div>
                  </div>
                </dl>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {p.credits.length > 0 && (
                  <a href="#filmografi" className="group flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                    Filmografi <ArrowDown className="size-4 transition group-hover:translate-y-0.5" aria-hidden="true" />
                  </a>
                )}
                {p.bio && (
                  <a href="#biyografi" className="flex h-12 items-center rounded-full border border-foreground/20 px-5 text-sm font-medium transition hover:border-foreground/60">
                    Biyografi
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <dl className="mx-auto -mt-16 grid w-full max-w-[1440px] grid-cols-2 gap-px overflow-hidden bg-border px-0 sm:grid-cols-4 lg:rounded-2xl lg:ring-1 lg:ring-border">
        {stats.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-2 bg-card px-5 py-6 sm:px-8">
            <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{k}</dt>
            <dd className="text-3xl font-bold tracking-[-0.03em]">{v}</dd>
          </div>
        ))}
      </dl>

      {signature.length > 0 && (
        <section aria-labelledby="roller-baslik" className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 sm:px-6 lg:px-10">
          <CineHeading id="roller-baslik" eyebrow="İmza roller" title="Canlandırdığı" accent="karakterler" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {signature.map((c) => (
              <li key={c.key}>
                <SignatureRole credit={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.credits.length > 0 ? (
        <section id="filmografi" aria-labelledby="filmografi-baslik" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-10 px-4 sm:px-6 lg:px-10">
          <CineHeading id="filmografi-baslik" eyebrow="Yıl yıl" title="Tüm" accent="filmografi" aside={<p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{films} film · {series} dizi</p>} />
          <ActorFilmography credits={p.credits} />
        </section>
      ) : (
        <p className="mx-auto w-full max-w-[1440px] px-4 text-muted-foreground sm:px-6 lg:px-10">Bu oyuncunun filmografisi henüz kataloğumuzda yok.</p>
      )}

      {p.bio && (
        <section id="biyografi" aria-labelledby="biyografi-baslik" className="mx-auto grid w-full max-w-[1440px] scroll-mt-24 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:px-10">
          <div className="self-start lg:sticky lg:top-24">
            <CineHeading id="biyografi-baslik" eyebrow="Biyografi" title="Hayat" accent="hikâyesi" />
          </div>
          <div className="flex flex-col gap-4">
            <ExpandableText text={p.bio} lines={8} className="max-w-3xl text-pretty text-lg leading-relaxed text-foreground/80" />
            <p className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {p.bioTranslated && <span>Otomatik çeviri</span>}
              {p.wikiUrl && (
                <a href={p.wikiUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition hover:text-ink">
                  Kaynak: Wikipedia <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              )}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
