'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react'

const LostVoidScene = dynamic(() => import('./lost-void-scene'), { ssr: false, loading: () => null })

const WAYS_OUT = [
  { href: '/ara', label: 'Keşfet', note: 'Türler ve sezonlar' },
  { href: '/rastgele', label: 'Rastgele öneri', note: 'Rastgele bir seri çek' },
  { href: '/takvim', label: 'Takvim', note: 'Bu haftanın bölümleri' },
]

export function NotFoundView({ covers }: { covers: string[] }) {
  const router = useRouter()
  const reduced = Boolean(useReducedMotion())
  const [q, setQ] = useState('')

  return (
    <main data-lost-stage className="dark relative isolate flex min-h-dvh flex-col overflow-hidden bg-scrim text-on-scrim">
      <div className="absolute inset-0 -z-10">
        <LostVoidScene covers={covers} reduced={reduced} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_55%_at_50%_50%,var(--scrim)_20%,transparent_100%)] opacity-90" />

      <header className="flex items-center justify-between px-5 py-5 sm:px-10 sm:py-8">
        <Link href="/" className="text-base font-bold tracking-tight">
          Sytheris
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-on-scrim/55">Hata · 404</span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">Kayıp bölüm</p>
        <h1 className="flex flex-col items-center gap-4">
          <span className="text-[clamp(120px,24vw,300px)] font-black leading-[0.8] tracking-[-0.06em]">404</span>
          <span className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Bu sayfa boşlukta <span className="font-serif font-normal italic">kayboldu</span>.
          </span>
        </h1>
        <p className="max-w-md text-pretty leading-relaxed text-on-scrim/65">
          Etrafında süzülen kapaklar hâlâ burada, ama aradığın sayfa yok. Adresi kontrol et ya da doğrudan aramayı dene.
        </p>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const term = q.trim()
            router.push(term ? `/ara?q=${encodeURIComponent(term)}` : '/ara')
          }}
          className="flex w-full max-w-md items-center gap-2 rounded-full border border-on-scrim/20 bg-scrim/70 p-1.5 pl-5 backdrop-blur focus-within:border-on-scrim/60"
        >
          <Search className="size-4 shrink-0 text-on-scrim/50" aria-hidden="true" />
          <label htmlFor="lost-search" className="sr-only">
            Anime ara
          </label>
          <input
            id="lost-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bir anime ara…"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-on-scrim outline-none placeholder:text-on-scrim/40"
          />
          <button type="submit" className="h-10 rounded-full bg-on-scrim px-5 text-sm font-semibold text-scrim transition hover:opacity-90">
            Ara
          </button>
        </form>

        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-on-scrim/75 underline-offset-4 transition hover:text-on-scrim hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" /> Ana sayfaya dön
        </Link>
      </section>

      <nav aria-label="Başka yerler" className="grid border-t border-on-scrim/10 bg-scrim/60 backdrop-blur sm:grid-cols-3">
        {WAYS_OUT.map((w) => (
          <Link key={w.href} href={w.href} className="group flex items-center justify-between gap-4 border-on-scrim/10 px-5 py-5 transition hover:bg-on-scrim/5 sm:border-l sm:px-8 first:sm:border-l-0">
            <span className="flex flex-col gap-0.5 text-left">
              <span className="font-semibold">{w.label}</span>
              <span className="text-sm text-on-scrim/55">{w.note}</span>
            </span>
            <ArrowUpRight className="size-4 text-on-scrim/50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-on-scrim" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </main>
  )
}
