import Link from 'next/link'
import { ArrowLeft, ArrowRight, Brush, Layers, Lock, SplitSquareHorizontal, Wand2 } from 'lucide-react'
import { Mascot } from '@/components/mascot/mascot'

const PERKS = [
  { icon: Layers, text: '16 katman, 11 karışım modu' },
  { icon: Brush, text: 'Basınca duyarlı 6 fırça ve sabitleyici' },
  { icon: SplitSquareHorizontal, text: 'Simetrik çizim ve ayna görünüm' },
  { icon: Wand2, text: 'Bulutta taslak, tek tıkla galeri' },
]

export function StudioGate({ reason }: { reason: 'login' | 'premium' }) {
  const login = reason === 'login'
  return (
    <main className="dark relative isolate grid min-h-dvh overflow-hidden bg-scrim text-on-scrim lg:grid-cols-[1.1fr_1fr]">
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="relative flex flex-col justify-between gap-12 px-6 py-8 sm:px-12 sm:py-10">
        <Link href="/atolye" className="flex w-fit items-center gap-2 text-sm text-on-scrim/60 transition hover:text-on-scrim">
          <ArrowLeft className="size-4" aria-hidden="true" /> Galeriye dön
        </Link>
        <div className="flex max-w-xl flex-col gap-7">
          <p className="label-mono flex items-center gap-3 text-ink">
            <Lock className="size-3.5" aria-hidden="true" />
            {login ? 'Giriş gerekli' : 'Sytheris+ ayrıcalığı'}
          </p>
          <h1 className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-7xl">
            Stüdyonun kapısı <span className="accent-serif">{login ? 'seni' : 'üyelere'}</span> bekliyor.
          </h1>
          <p className="max-w-md text-pretty text-lg leading-relaxed text-on-scrim/65">
            {login
              ? 'Çizim Atölyesi’ni açmak için önce hesabına giriş yap. Galeriyi herkes gezebilir; fırçaya dokunmak üyelere özel.'
              : 'Katmanlı, basınca duyarlı tarayıcı stüdyosu Sytheris+ ve Ultra üyelerine açık. Çiz, kaydet, galeride sergile.'}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 rounded-2xl border border-on-scrim/10 bg-on-scrim/[0.04] px-4 py-3 text-sm text-on-scrim/80">
                <p.icon className="size-4 shrink-0 text-ink" aria-hidden="true" />
                {p.text}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              href={login ? '/giris' : '/abonelik'}
              className="group flex h-13 items-center gap-3 rounded-full bg-primary py-3 pl-6 pr-2 font-semibold text-primary-foreground shadow-[0_18px_50px_-14px_var(--primary)] transition hover:brightness-110"
            >
              {login ? 'Giriş yap' : 'Sytheris+’ya geç'}
              <span className="grid size-9 place-items-center rounded-full bg-primary-foreground text-primary transition-transform duration-500 group-hover:-rotate-45">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
            <Link href="/atolye" className="flex h-13 items-center rounded-full border border-on-scrim/20 px-6 py-3 text-sm font-medium text-on-scrim/80 transition hover:border-primary hover:text-on-scrim">
              Sergiyi gez
            </Link>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-scrim/35">Sytheris Atölye · Tarayıcıda çalışır, kurulum gerekmez</p>
      </div>
      <div className="at-hall relative hidden min-h-[60vh] items-center justify-center p-16 lg:flex">
        <div aria-hidden="true" className="at-spot pointer-events-none absolute -top-10 left-1/2 h-full w-full -translate-x-1/2" />
        <div className="at-frame relative w-full max-w-sm">
          <div className="at-mat !p-0">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Mascot mood="think" pose="full" className="absolute inset-x-0 bottom-0 top-[6%]" priority />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
