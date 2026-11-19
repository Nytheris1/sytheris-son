'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mascotSrc, type MascotMood } from '@/components/mascot/mascot'

const OUT = [0.16, 1, 0.3, 1] as const
const SNAP = [0.83, 0, 0.17, 1] as const

const LINES = [
  'Haritaya göre burada bir sayfa olmalıydı… galiba ters tutuyorum.',
  'Bu bölüm henüz çizilmemiş. Ya da ben yanlış ciltteyim.',
  'Sessiz ol — kaybolduğumu kimseye söyleme, tamam mı?',
]

type Props = {
  code?: string
  /** Big word under the band, e.g. "BULUNAMADI". */
  word?: string
  title?: string
  accent?: string
  message?: string
  mood?: MascotMood
  /** Rendered inside the site shell: no own header, shorter height. */
  embedded?: boolean
  /** Replaces the first link column (e.g. a "Tekrar dene" button on error pages). */
  primaryAction?: React.ReactNode
}

function Letters({ text, delay, className }: { text: string; delay: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex w-full justify-between overflow-hidden', className)}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className="block"
          initial={{ y: '105%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 1, delay: delay + i * 0.045, ease: OUT }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

function LinkColumn({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Link href={href} className="group flex flex-col gap-1.5 border-on-scrim/15 py-4 outline-none sm:border-l sm:px-6 sm:py-0">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-on-scrim transition group-hover:text-ink group-focus-visible:text-ink">
        <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        {title}
      </span>
      <span className="text-sm text-on-scrim/55">{note}</span>
    </Link>
  )
}

/**
 * Status pages (404, 500, …): an oversized code, a cinematic band with Syra's eyes peeking through,
 * an oversized word underneath and a row of ways out.
 */
export function LostScene({ code = '404', word = 'BULUNAMADI', title, accent, message, mood = 'lost', embedded, primaryAction }: Props) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)])
  const heading = `${title ?? 'Bu sayfa başka'} ${accent ?? 'bir evrende.'}`

  return (
    <main className={cn('dark relative isolate flex flex-col overflow-hidden bg-scrim text-on-scrim', embedded ? 'min-h-[86dvh]' : 'min-h-dvh')}>
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10" />

      {!embedded && (
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10">
          <Link href="/" className="text-sm font-bold tracking-[-0.02em]">
            <span className="text-primary">S</span>YTHERIS
          </Link>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-on-scrim/50 sm:inline">Kayıp bölüm · Hata {code}</span>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-on-scrim/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] transition hover:border-primary hover:text-ink"
          >
            Ana sayfa <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </header>
      )}

      <h1 className="sr-only">
        {code} — {heading}
      </h1>

      <section className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8">
        <Letters text={code} delay={0.1} className="relative z-10 -mb-[0.11em] justify-center text-[clamp(7rem,31vw,27rem)] font-bold leading-[0.8] tracking-[-0.06em]" />

        <motion.div
          className="relative h-[clamp(150px,27vh,300px)] w-full overflow-hidden bg-[linear-gradient(90deg,var(--scrim),color-mix(in_oklch,var(--primary)_40%,var(--scrim))_50%,var(--scrim))]"
          initial={{ clipPath: 'inset(0% 50% 0% 50%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.2, delay: 0.45, ease: SNAP }}
        >
          <div aria-hidden="true" className="halftone absolute inset-0 text-on-scrim/10" />
          <motion.div className="absolute inset-0" initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ duration: 2.2, delay: 0.45, ease: OUT }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mascotSrc(mood)} alt="" className="absolute left-1/2 top-1/2 h-[330%] max-w-none -translate-x-1/2 -translate-y-[31%] object-contain" />
          </motion.div>
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,var(--scrim)_0%,transparent_22%,transparent_78%,var(--scrim)_100%)]" />
          <motion.p
            className="absolute bottom-3 right-4 hidden max-w-[240px] text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-on-scrim/75 sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            role="status"
          >
            “{line}”
          </motion.p>
          <span aria-hidden="true" className="absolute left-4 top-3 font-mono text-[10px] uppercase tracking-[0.24em] text-on-scrim/60">
            [ Syra · {code} ]
          </span>
        </motion.div>

        <Letters text={word} delay={0.35} className="relative z-10 -mt-[0.06em] text-[clamp(3rem,13vw,13.5rem)] font-bold leading-[0.82] tracking-[-0.05em]" />
      </section>

      <motion.footer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: OUT }}
        className="grid gap-6 px-5 pb-10 sm:px-10 lg:grid-cols-[1.1fr_2fr] lg:items-end"
      >
        <div className="flex flex-col gap-3">
          <p className="text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
            {title ?? 'Bu sayfa başka'} <span className="font-serif font-normal italic text-ink">{accent ?? 'bir evrende.'}</span>
          </p>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-on-scrim/60">
            {message ?? 'Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir. Ama aradığın anime büyük ihtimalle burada.'}
          </p>
        </div>

        <div className="grid divide-y divide-on-scrim/10 sm:grid-cols-3 sm:divide-y-0">
          {primaryAction ?? <LinkColumn href="/" title="Ana sayfa" note="Trendlere ve Top 10’a dön" />}
          <LinkColumn href="/rastgele" title="Kaderine bırak" note="Desteden rastgele bir anime çek" />
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              router.push(q.trim() ? `/ara?q=${encodeURIComponent(q.trim())}` : '/ara')
            }}
            className="flex flex-col gap-2 border-on-scrim/15 py-4 sm:border-l sm:px-6 sm:py-0"
          >
            <label htmlFor="lost-q" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
              <Search className="size-3.5" aria-hidden="true" /> Ara
            </label>
            <div className="flex items-center gap-2 border-b border-on-scrim/25 focus-within:border-primary">
              <input
                id="lost-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Frieren, Mushishi…"
                className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-on-scrim/35"
              />
              <button type="submit" className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-scrim/70 transition hover:text-ink" aria-label="Aramayı başlat">
                Git
              </button>
            </div>
          </form>
        </div>
      </motion.footer>
    </main>
  )
}
