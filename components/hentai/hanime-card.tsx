import Link from 'next/link'
import { Eye, Play } from 'lucide-react'
import type { HanimeVideo } from '@/lib/hanime/catalog'
import { shortDuration, compactNumber } from '@/lib/hanime/format'

export function HanimeCard({ video, badge }: { video: HanimeVideo; badge?: string }) {
  return (
    <Link href={`/hentai/${video.slug}`} className="group flex flex-col gap-2.5 outline-none">
      <span className="relative block aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border transition duration-500 group-hover:ring-rose-500/60">
        {(video.poster || video.cover) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(video.poster ?? video.cover)!} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-2 top-2 rounded-sm bg-rose-600 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-white">
          {video.censored ? 'CENSORED' : 'UNCENSORED'}
        </span>
        {badge && <span className="absolute right-2 top-2 rounded-sm bg-foreground/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-background">{badge}</span>}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-scrim/80 px-2 py-0.5 font-mono text-[10px] text-on-scrim">
          <Play className="size-2.5 fill-current" aria-hidden="true" /> {shortDuration(video.durationMs)}
        </span>
        <span className="absolute bottom-2 left-2 flex items-center gap-1 font-mono text-[10px] text-on-scrim/80">
          <Eye className="size-2.5" aria-hidden="true" /> {compactNumber(video.views)}
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-ink">{video.name}</span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{video.brand ?? '—'}</span>
      </span>
    </Link>
  )
}