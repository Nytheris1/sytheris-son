'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { Check, Clapperboard, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { setContentMode } from '@/app/actions/content-mode'
import type { ContentMode } from '@/lib/content-mode-shared'
import { cn } from '@/lib/utils'

const OPTIONS: { id: ContentMode; title: string; accent: string; body: string; points: string[]; image: string; icon: typeof Sparkles }[] = [
  {
    id: 'anime',
    title: 'Anime',
    accent: 'modu',
    body: 'Sytheris’in kalbi. AniList’ten canlı gelen katalog, sezonlar, karakterler ve seslendirmenler.',
    points: ['Türkiye Top 10 ve sezon listeleri', 'Bölüm izleme, kütüphane, takvim', 'Manga okuyucu ve karakter dosyaları'],
    image: '/modes/anime.webp',
    icon: Sparkles,
  },
  {
    id: 'film',
    title: 'Sinema',
    accent: 'modu',
    body: 'Anime olmayan, canlı çekim filmler. Ana sayfa ve menü bir sinema salonuna dönüşür.',
    points: ['Türkiye listelerinden haftanın filmleri', 'Resmî fragmanlar ve Türkçe özetler', 'Tür seansları: aksiyondan klasiklere'],
    image: '/modes/cinema.webp',
    icon: Clapperboard,
  },
]

export function ContentModePanel({ mode }: { mode: ContentMode }) {
  const router = useRouter()
  const [current, setCurrent] = useState(mode)
  const [pending, start] = useTransition()

  const choose = (next: ContentMode) => {
    if (next === current || pending) return
    const prev = current
    setCurrent(next)
    start(async () => {
      const res = await setContentMode(next).catch(() => null)
      if (!res?.ok) {
        setCurrent(prev)
        toast.error('Mod değiştirilemedi, tekrar dene.')
        return
      }
      toast.success(next === 'film' ? 'Sinema modu açık — ana sayfa filmlerle yenilendi' : 'Anime moduna dönüldü')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="İçerik modu" className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((o) => {
          const on = current === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(o.id)}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-[1.75rem] border text-left outline-none transition duration-500 focus-visible:ring-2 focus-visible:ring-primary',
                on ? 'border-primary shadow-[0_24px_60px_-30px_var(--primary)]' : 'border-border hover:-translate-y-1 hover:border-foreground/30',
              )}
            >
              <span className="dark relative block h-44 overflow-hidden bg-scrim sm:h-52">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.image || '/placeholder.svg'} alt="" className={cn('absolute inset-0 size-full object-cover transition duration-1000 group-hover:scale-105', !on && 'grayscale-[0.6]')} />
                <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/30 to-transparent" />
                <span className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-scrim/60 px-3 py-1.5 text-xs font-medium text-on-scrim backdrop-blur">
                  <o.icon className="size-3.5" /> {o.id === 'anime' ? 'Varsayılan' : 'Yeni'}
                </span>
                <span className={cn('absolute right-5 top-5 grid size-8 place-items-center rounded-full border-2 transition', on ? 'border-primary bg-primary text-primary-foreground' : 'border-on-scrim/50 bg-scrim/40 text-transparent')}>
                  {pending && on ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="absolute bottom-4 left-5 text-3xl font-bold tracking-tight text-on-scrim">
                  {o.title} <span className="font-serif font-normal italic">{o.accent}</span>
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-4 bg-card p-5">
                <span className="text-pretty text-sm leading-relaxed text-muted-foreground">{o.body}</span>
                <ul className="flex flex-col gap-2">
                  {o.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm">
                      <span className={cn('size-1.5 shrink-0 rounded-full', on ? 'bg-primary' : 'bg-muted-foreground/50')} />
                      {p}
                    </li>
                  ))}
                </ul>
              </span>
              {on && <motion.span layoutId="mode-ring" className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-2 ring-primary" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            </button>
          )
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Tercih bu tarayıcıda saklanır. Listelerin, favorilerin ve yorumların iki modda da korunur; yalnızca keşfettiğin katalog değişir.</p>
    </div>
  )
}
