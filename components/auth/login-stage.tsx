'use client'

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { Crown, Dices, Heart, LibraryBig, MessageCircle } from 'lucide-react'
import { Mascot } from '@/components/mascot/mascot'

const LINES = [
  { icon: LibraryBig, title: 'Kütüphaneni kur', body: 'İzlediklerini düzenle, kendi koleksiyonlarını oluştur.' },
  { icon: Dices, title: 'Kaderini çek', body: 'Ruh haline göre efsanevi bir kart seni bekliyor.' },
  { icon: MessageCircle, title: 'Topluluğa katıl', body: 'Yorum yap, GIF at, spoiler’ları gizle.' },
  { icon: Crown, title: 'Parla', body: 'Çerçeveler, afiş efektleri, renkli isim stilleri ve rozetler.' },
  { icon: Heart, title: 'Favorilerini sakla', body: 'Sevdiğin her seri bir tık uzağında.' },
]

const OUT = [0.16, 1, 0.3, 1] as const

function MemberCard() {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [12, -12]), { stiffness: 160, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-16, 16]), { stiffness: 160, damping: 18 })
  const shine = useTransform([mx, my], ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, oklch(1 0 0 / 0.35), transparent 50%)`)

  return (
    <motion.div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
      initial={{ opacity: 0, y: 60, rotateZ: -8 }}
      animate={{ opacity: 1, y: 0, rotateZ: -4 }}
      transition={{ duration: 1.1, delay: 0.2, ease: OUT }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className="sy-holo relative aspect-[1.586] w-[min(440px,100%)] overflow-hidden rounded-[1.6rem] border border-foreground/20 bg-gradient-to-br from-card via-scrim to-card shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8)]"
    >
      <div aria-hidden="true" className="halftone absolute inset-0 text-primary/25 [mask-image:linear-gradient(120deg,black,transparent_60%)]" />
      <div aria-hidden="true" className="absolute -right-6 bottom-0 top-2 w-[58%]">
        <div className="mask-soft size-full">
          <Mascot mood="secret" pose="full" className="size-full" />
        </div>
      </div>
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ background: shine }} />
      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-[-0.02em]">
            <span className="text-primary">S</span>YTHERIS
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/50">Üye kartı</span>
          <span className="font-serif text-4xl italic leading-none">Sen.</span>
          <span className="mt-3 font-mono text-xs tracking-[0.25em] text-foreground/70">No. 0000 · 0001 · 2026</span>
        </div>
      </div>
      <span aria-hidden="true" className="absolute left-6 top-14 h-7 w-10 rounded-md bg-gradient-to-br from-[oklch(0.85_0.12_85)] to-[oklch(0.65_0.12_70)] opacity-90" />
    </motion.div>
  )
}

export function LoginStage() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % LINES.length), 3200)
    return () => window.clearInterval(id)
  }, [])
  const line = LINES[i]

  return (
    <div className="relative hidden flex-col justify-between gap-10 overflow-hidden p-12 lg:flex">
      <div aria-hidden="true" className="speed-lines pointer-events-none absolute inset-[-30%] text-foreground/[0.04]" />
      <p className="label-mono relative flex items-center gap-3 text-ink">
        <span className="h-px w-10 bg-primary" /> Sytheris hesabı
      </p>

      <div className="relative z-10 flex flex-col gap-10">
        <h2 className="max-w-xl text-balance text-6xl font-bold leading-[0.92] tracking-[-0.05em] xl:text-7xl">
          Hikâyen <span className="accent-serif">kaldığın yerden</span> devam etsin.
        </h2>
        <MemberCard />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <div className="h-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <line.icon className="size-5" />
              </span>
              <span>
                <span className="block text-lg font-semibold">{line.title}</span>
                <span className="block text-sm leading-relaxed text-foreground/65">{line.body}</span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {LINES.map((_, n) => (
            <span key={n} className={`h-1 rounded-full transition-all duration-500 ${n === i ? 'w-8 bg-primary' : 'w-2 bg-foreground/25'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
