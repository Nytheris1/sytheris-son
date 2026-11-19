'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, Clapperboard, Dices, LibraryBig } from 'lucide-react'
import { Mascot } from '@/components/mascot/mascot'

const OUT = [0.16, 1, 0.3, 1] as const

const LINES = [
  'Kararsız mısın? Rastgele öneri senin yerine seçsin.',
  'Bu hafta yayınlanan bölümleri takvimde işaretledim.',
  'Korku Filmleri açıldı. Işıkları kapatmayı unutma.',
  'Bitirdiğin animeleri kütüphanene ekle, rozetlerin gelsin.',
]

const ACTIONS = [
  { href: '/rastgele', label: 'Rastgele anime seç', icon: Dices },
  { href: '/takvim', label: 'Yayın takvimi', icon: CalendarDays },
  { href: '/korku', label: 'Korku Filmleri', icon: Clapperboard },
  { href: '/kutuphane', label: 'Kütüphanem', icon: LibraryBig },
]

function greeting(h: number) {
  if (h < 5) return 'Hâlâ uyanık mısın?'
  if (h < 12) return 'Günaydın.'
  if (h < 18) return 'İyi günler.'
  if (h < 22) return 'İyi akşamlar.'
  return 'İyi geceler.'
}

export function SyraSpotlight() {
  const [hello, setHello] = useState('Merhaba.')
  const [line, setLine] = useState(0)

  useEffect(() => {
    setHello(greeting(new Date().getHours()))
    const id = window.setInterval(() => setLine((l) => (l + 1) % LINES.length), 5200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10" aria-labelledby="syra-hello">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: OUT }}
        className="dark relative isolate grid overflow-hidden rounded-[2rem] border border-border bg-scrim text-foreground md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_18%_100%,color-mix(in_oklch,var(--primary)_32%,transparent),transparent_70%)]" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10" />
        <span aria-hidden="true" className="font-jp pointer-events-none absolute -right-6 -top-10 select-none text-[12rem] font-black leading-none text-foreground/[0.03]">
          案内
        </span>

        <div className="relative h-72 md:h-auto md:min-h-[360px]">
          <Mascot mood="wave" pose="full" className="absolute inset-x-0 bottom-0 top-4" />
        </div>

        <div className="relative flex flex-col justify-center gap-6 p-6 pt-2 sm:p-10 md:pl-0">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" /> Syra diyor ki
          </p>
          <h2 id="syra-hello" className="text-balance text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl">
            {hello} <span className="accent-serif font-normal">Bu akşam ne izliyoruz?</span>
          </h2>
          <div className="relative grid min-h-20 max-w-lg items-start [&>*]:[grid-area:1/1]">
            <AnimatePresence initial={false}>
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: OUT }}
                className="rounded-2xl rounded-tl-sm border border-foreground/10 bg-foreground/[0.06] px-4 py-3 text-pretty leading-relaxed text-foreground/80 backdrop-blur"
                role="status"
              >
                {LINES[line]}
              </motion.p>
            </AnimatePresence>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ACTIONS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.04] px-4 py-3 text-sm font-medium transition hover:border-primary/60 hover:bg-primary/10"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ArrowUpRight className="size-4 text-foreground/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  )
}
