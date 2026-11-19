'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { CharacterEdge } from '@/lib/anilist-types'
import { roleTr } from '@/lib/format'

export function CharactersGrid({ edges }: { edges: CharacterEdge[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? edges : edges.slice(0, 8)
  return (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((e, i) => {
          const va = e.voiceActors?.[0]
          return (
            <motion.li
              key={e.node.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              className="group flex overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/60"
            >
              <Link href={`/karakter/${e.node.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.node.image.large || '/placeholder.svg'} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-xl object-cover transition duration-500 group-hover:scale-105" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{e.node.name.full}</span>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${e.role === 'MAIN' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {roleTr(e.role)}
                  </span>
                </span>
              </Link>
              {va && (
                <Link href={`/seslendirmen/${va.id}`} className="flex min-w-0 max-w-[45%] items-center justify-end gap-3 border-l border-border bg-muted/40 p-2.5 text-right">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{va.name.full}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Seslendirmen</span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={va.image.large || '/placeholder.svg'} alt="" loading="lazy" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                </Link>
              )}
            </motion.li>
          )
        })}
      </ul>
      {edges.length > 8 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary">
          {all ? 'Daha az göster' : `Tüm karakterler (${edges.length})`}
        </button>
      )}
    </div>
  )
}
