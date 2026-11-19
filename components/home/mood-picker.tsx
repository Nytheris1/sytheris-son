'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Mascot } from '@/components/mascot/mascot'

const MOODS = [
  { label: 'Ağlatsın', kanji: '涙', href: '/ara?genre=Drama&sort=SCORE_DESC' },
  { label: 'Güldürsün', kanji: '笑', href: '/ara?genre=Comedy&sort=POPULARITY_DESC' },
  { label: 'Kafamı yaksın', kanji: '謎', href: '/ara?genre=Psychological&sort=SCORE_DESC' },
  { label: 'İçimi ısıtsın', kanji: '癒', href: '/ara?tag=Iyashikei&sort=SCORE_DESC' },
  { label: 'Adrenalin', kanji: '戦', href: '/ara?genre=Action&sort=TRENDING_DESC' },
  { label: 'Aşk dolsun', kanji: '恋', href: '/ara?genre=Romance&sort=POPULARITY_DESC' },
  { label: 'Başka dünya', kanji: '異', href: '/ara?tag=Isekai&sort=POPULARITY_DESC' },
  { label: 'Gerilsin', kanji: '恐', href: '/ara?genre=Thriller&sort=SCORE_DESC' },
]

function greeting(h: number) {
  if (h < 5) return { hi: 'Gece kuşu musun?', say: 'Saat geç oldu ama… bir bölüm daha kimseye zarar vermez.' }
  if (h < 12) return { hi: 'Günaydın.', say: 'Kahven hazırsa sabaha hafif bir slice of life iyi gider.' }
  if (h < 18) return { hi: 'İyi günler.', say: 'Öğleden sonra boşluğu için kısa bir seri bulalım mı?' }
  return { hi: 'İyi akşamlar.', say: 'Akşam en sevdiğim saat. Ruh haline göre seçelim.' }
}

export function MoodPicker() {
  const [g, setG] = useState(() => greeting(12))
  useEffect(() => setG(greeting(new Date().getHours())), [])

  return (
    <section aria-labelledby="mood-title" className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div className="relative isolate grid overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_340px]">
        <div aria-hidden="true" className="halftone halftone-fade pointer-events-none absolute inset-0 -z-10 text-primary/15" />
        <div className="flex flex-col gap-7 p-6 sm:p-10">
          <div className="flex flex-col gap-3">
            <p className="label-mono flex items-center gap-3 text-ink">
              <span className="h-px w-8 bg-primary" /> {g.hi}
            </p>
            <h2 id="mood-title" className="text-balance text-3xl font-bold leading-[1] tracking-[-0.04em] sm:text-5xl">
              Bugün ne <span className="accent-serif">hissetmek</span> istiyorsun?
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MOODS.map((m, i) => (
              <motion.li
                key={m.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={m.href}
                  className="group relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-background px-4 py-4 transition hover:-translate-y-0.5 hover:border-primary"
                >
                  <span className="relative z-10 text-sm font-semibold sm:text-base">{m.label}</span>
                  <span aria-hidden="true" className="absolute inset-0 origin-bottom scale-y-0 bg-primary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
                  <ArrowUpRight aria-hidden="true" className="absolute right-2 top-2 z-10 size-3.5 opacity-0 text-primary-foreground transition group-hover:opacity-100" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="relative hidden min-h-[300px] md:block">
          <p className="absolute left-0 top-8 z-10 max-w-[220px] -rotate-2 rounded-[1.2rem] rounded-br-md border-2 border-foreground bg-foreground px-4 py-3 text-sm font-medium leading-relaxed text-background shadow-[4px_4px_0_var(--primary)]">
            {g.say}
          </p>
          <div className="absolute inset-x-0 bottom-0 top-10">
            <Mascot mood="think" pose="full" className="size-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
