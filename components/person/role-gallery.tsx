'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type Role = {
  characterId: number
  characterName: string
  characterImage?: string | null
  mediaId: number
  mediaTitle: string
  mediaCover?: string | null
  mediaColor?: string | null
  series: string[]
  year?: number | null
  role: string
}

const FILTERS = [
  { id: 'ALL', label: 'Tümü' },
  { id: 'MAIN', label: 'Başrol' },
  { id: 'SUPPORTING', label: 'Yan rol' },
  { id: 'BACKGROUND', label: 'Arka plan' },
] as const

const ROLE_LABEL: Record<string, string> = { MAIN: 'Başrol', SUPPORTING: 'Yan rol', BACKGROUND: 'Arka plan' }
const OUT = [0.16, 1, 0.3, 1] as const
const PAGE = 18

/** Full-body art is resolved lazily per card by /api/fullbody, falling back to the AniList portrait. */
export function fullBodySrc(r: Pick<Role, 'characterName' | 'series' | 'characterImage'>) {
  const p = new URLSearchParams({ n: r.characterName, s: r.series.join('|') })
  if (r.characterImage) p.set('f', r.characterImage)
  return `/api/fullbody?${p.toString()}`
}

export function RoleGallery({ roles }: { roles: Role[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('ALL')
  const [limit, setLimit] = useState(PAGE)
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: roles.length }
    for (const r of roles) c[r.role] = (c[r.role] ?? 0) + 1
    return c
  }, [roles])
  const filtered = filter === 'ALL' ? roles : roles.filter((r) => r.role === filter)
  const shown = filtered.slice(0, limit)

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label="Rol filtresi" className="flex flex-wrap gap-2">
        {FILTERS.filter((f) => f.id === 'ALL' || counts[f.id]).map((f) => {
          const on = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setFilter(f.id)
                setLimit(PAGE)
              }}
              className={cn(
                'relative isolate flex h-9 items-center gap-2 border-2 px-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition',
                on ? 'border-foreground text-background' : 'border-foreground/15 text-muted-foreground hover:border-foreground hover:text-foreground',
              )}
            >
              {on && <motion.span layoutId="role-filter" className="absolute inset-0 -z-10 bg-foreground" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              {f.label}
              <span className="tabular-nums opacity-60">{counts[f.id] ?? 0}</span>
            </button>
          )
        })}
      </div>

      <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {shown.map((r, i) => (
            <motion.li
              key={`${r.characterId}-${r.mediaId}`}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.55, delay: Math.min(i % PAGE, 12) * 0.035, ease: OUT }}
              className="group flex flex-col gap-3"
              style={r.mediaColor ? ({ ['--card-tone' as string]: r.mediaColor } as React.CSSProperties) : undefined}
            >
              <div className="relative">
                <Link href={`/karakter/${r.characterId}`} className="role-card relative block aspect-[3/5] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                  <span aria-hidden="true" className="role-card-num absolute -left-1 top-1 select-none text-7xl font-black leading-none tracking-[-0.06em]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullBodySrc(r)}
                    alt={`${r.characterName}, tam boy`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget
                      const next = r.characterImage && img.dataset.fallback !== '1' ? r.characterImage : '/placeholder-user.jpg'
                      if (img.dataset.fallback === '2') return
                      img.dataset.fallback = img.dataset.fallback === '1' ? '2' : '1'
                      img.src = next
                    }}
                    className="absolute inset-0 size-full object-cover object-top transition duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/55 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <span
                    className={cn(
                      'absolute left-2 top-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]',
                      r.role === 'MAIN' ? 'bg-foreground text-background' : 'bg-background/85 text-foreground backdrop-blur',
                    )}
                  >
                    {ROLE_LABEL[r.role] ?? r.role}
                  </span>
                </Link>
                <Link
                  href={`/anime/${r.mediaId}`}
                  aria-label={`${r.mediaTitle} animesine git`}
                  className="absolute -bottom-3 -right-1.5 block w-[34%] origin-bottom-right rotate-[5deg] overflow-hidden shadow-xl ring-2 ring-background transition duration-500 group-hover:rotate-0 group-hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.mediaCover || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
                </Link>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 pr-[30%]">
                <Link href={`/karakter/${r.characterId}`} lang="en" className="truncate text-sm font-black uppercase tracking-tight transition hover:underline">
                  {r.characterName}
                </Link>
                <Link href={`/anime/${r.mediaId}`} className="line-clamp-1 text-xs text-muted-foreground transition hover:text-foreground">
                  {r.mediaTitle}
                  {r.year ? ` · ${r.year}` : ''}
                </Link>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="mx-auto flex h-11 items-center gap-2 border-2 border-foreground px-6 font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition hover:bg-foreground hover:text-background"
        >
          Daha fazla göster <span className="tabular-nums opacity-60">{filtered.length - limit}</span>
        </button>
      )}
    </div>
  )
}
