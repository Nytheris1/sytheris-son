'use client'

import { motion, useSpring, useTransform } from 'motion/react'
import { useSectionProgress } from '@/lib/use-section-progress'
import { useEffect, useRef, useState } from 'react'
import { MASCOT } from '@/components/mascot/mascot-config'

type Feature = { jp: string; title: string; body: string; href: string; art: 'covers' | 'fan' | 'shelf' | 'image'; image?: string }

const FEATURES: Feature[] = [
  { jp: '探索', title: 'Keşif', body: 'Türlere, sezonlara, “kafa yakan” etiketlere ve ruh haline göre filtrele. AniList verisi, Türkçe arayüz.', href: '/ara', art: 'covers' },
  { jp: '運命', title: 'Rastgele öneri', body: 'Kararsız kaldığında desteden bir kart çek. Kriterleri sen koy, gerisini kader seçsin.', href: '/rastgele', art: 'fan' },
  { jp: '書庫', title: 'Kütüphane', body: 'İzlediklerini, izleyeceklerini ve bıraktıklarını kendi rafında topla; ilerlemen hep yanında.', href: '/kutuphane', art: 'shelf' },
  { jp: '映画', title: 'Korku Filmleri', body: 'Özenle seçilmiş kısa korku filmleri, tek bir karanlık salonda. Işıkları kapat, sesi aç.', href: '/korku', art: 'image', image: '/korku/hero.webp' },
  { jp: '特別', title: 'Sytheris+', body: 'Profil çerçeveleri, afişler, isim stilleri ve rozetler. Profilin bir koleksiyon vitrini olsun.', href: '/abonelik', art: 'image', image: MASCOT.themes.gold },
]

function Art({ f, covers, i }: { f: Feature; covers: string[]; i: number }) {
  const pool = covers.length ? covers : ['/placeholder.svg']
  const at = (n: number) => pool[(i * 5 + n) % pool.length]
  if (f.art === 'covers') {
    return (
      <div className="grid size-full grid-cols-3 gap-2 p-2">
        {Array.from({ length: 6 }, (_, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={at(n) || '/placeholder.svg'} alt="" loading="lazy" className="size-full rounded-md object-cover" />
        ))}
      </div>
    )
  }
  if (f.art === 'fan') {
    return (
      <div className="relative size-full">
        {[-16, -6, 4, 14].map((rot, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={at(n) || '/placeholder.svg'}
            alt=""
            loading="lazy"
            className="absolute bottom-[8%] left-1/2 aspect-[2/3] w-[42%] rounded-xl object-cover shadow-2xl ring-4 ring-on-scrim"
            style={{ transform: `translateX(-50%) rotate(${rot}deg) translateY(${Math.abs(rot) * 0.8}px)`, transformOrigin: '50% 120%', zIndex: n }}
          />
        ))}
      </div>
    )
  }
  if (f.art === 'shelf') {
    return (
      <div className="flex size-full items-end gap-1.5 p-4">
        {Array.from({ length: 7 }, (_, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={at(n) || '/placeholder.svg'} alt="" loading="lazy" className="min-w-0 flex-1 rounded-sm object-cover shadow-lg" style={{ height: `${62 + ((n * 37) % 30)}%` }} />
        ))}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.image || '/placeholder.svg'} alt="" loading="lazy" className={f.image?.includes('mascot') ? 'size-full object-contain object-bottom' : 'size-full object-cover'} />
  )
}

/** Chapter 03 — the features, as a horizontal reel pinned to the screen and scrubbed by vertical scroll. */
export function ChapterFeatures({ covers, onGo }: { covers: string[]; onGo: (href: string) => void }) {
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const scrollYProgress = useSectionProgress(ref, ['start start', 'end end'])
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  const x = useTransform(p, [0, 1], [0, -distance])
  const bar = useTransform(p, [0, 1], [0, 1])

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <section ref={ref} id="ozellikler" aria-labelledby="features-title" className="relative bg-scrim" style={{ height: `calc(100dvh + ${distance}px)` }}>
      <div className="dark sticky top-0 flex h-dvh flex-col justify-center gap-10 overflow-hidden text-on-scrim">
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
        <div className="relative flex items-end justify-between gap-6 px-6 sm:px-10">
          <div className="flex flex-col items-start gap-1.5">
            <h2 id="features-title" lang="en" className="text-[clamp(40px,5vw,64px)] font-black uppercase leading-none tracking-[-0.02em]">
              System
            </h2>
          </div>
          <div className="hidden w-60 flex-col gap-2 sm:flex">
            <span className="text-right font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/50">Kaydırdıkça ilerler</span>
            <span className="relative h-px w-full bg-on-scrim/20">
              <motion.span style={{ scaleX: bar }} className="absolute inset-0 origin-left bg-primary" />
            </span>
          </div>
        </div>

        <motion.div ref={track} style={{ x }} className="relative flex w-max gap-5 px-6 sm:gap-8 sm:px-10">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="group relative flex h-[min(62dvh,560px)] w-[84vw] shrink-0 flex-col overflow-hidden border border-on-scrim/15 bg-on-scrim/[0.03] sm:w-[min(70vw,880px)] sm:flex-row">
              <div className="relative h-1/2 overflow-hidden bg-on-scrim/[0.04] sm:h-auto sm:w-[55%]">
                <div className="absolute inset-0 transition duration-700 group-hover:scale-[1.03]">
                  <Art f={f} covers={covers} i={i} />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-10">
                <span className="font-mono text-xs tabular-nums text-on-scrim/45">
                  {String(i + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                </span>
                <div className="flex flex-col gap-4">
                  <h3 className="text-balance text-3xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">{f.title}</h3>
                  <p className="max-w-sm text-pretty text-sm leading-relaxed text-on-scrim/65 sm:text-base">{f.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onGo(f.href)}
                  className="flex h-11 w-fit items-center border-2 border-on-scrim px-6 font-mono text-[11px] font-bold uppercase tracking-[0.28em] outline-none transition hover:bg-on-scrim hover:text-scrim focus-visible:bg-on-scrim focus-visible:text-scrim"
                >
                  Göz at <span className="sr-only">: {f.title}</span>
                </button>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
