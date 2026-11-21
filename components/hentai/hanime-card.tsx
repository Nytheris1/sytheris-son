import Link from 'next/link'
import { Eye, Play } from 'lucide-react'
import type { HanimeVideo } from '@/lib/hanime/catalog'
import { compactNumber, shortDuration } from '@/lib/hanime/format'

export function HanimeCard({ video, badge, rank }: { video: HanimeVideo; badge?: string; rank?: number }) {
  const cover = video.cover ?? video.poster
  return (
    <Link href={'/hentai/' + video.slug} className="ht-card group flex flex-col gap-2.5 outline-none">
      <span className="relative block aspect-[2/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1.5 group-hover:ht-glow-sm group-hover:ring-primary/70 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" aria-hidden="true" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.68_0.22_352_/_0.9)]">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          </span>
        </span>
        {rank ? (
          <span className="absolute left-2 top-2 font-mono text-2xl font-bold leading-none text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.85)]">{rank}</span>
        ) : (
          <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white/85 backdrop-blur-sm">
            {video.censored ? 'Cens' : 'Uncens'}
          </span>
        )}
        {badge && (
          <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black">
            {badge}
          </span>
        )}
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-between font-mono text-[10px] text-white/85">
          <span className="flex items-center gap-1">
            <Eye className="size-2.5" aria-hidden="true" /> {compactNumber(video.views)}
          </span>
          <span className="rounded bg-black/60 px-1.5 py-0.5 tabular-nums">{shortDuration(video.durationMs)}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground/90 transition group-hover:text-foreground">
          {video.name}
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{video.brand ?? '—'}</span>
      </span>
    </Link>
  )
}