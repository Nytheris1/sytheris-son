import Link from 'next/link'
import { Eye, Play } from 'lucide-react'
import type { HanimeVideo } from '@/lib/hanime/catalog'
import { compactNumber, shortDuration } from '@/lib/hanime/format'

export function HanimeCard({ video, badge }: { video: HanimeVideo; badge?: string }) {
  const cover = video.cover ?? video.poster
  return (
    <Link href={'/hentai/' + video.slug} className="group flex flex-col gap-3 outline-none">
      <span className="relative block aspect-[2/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-white/10 transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_26px_60px_-26px_rgba(244,63,94,0.55)] group-hover:ring-rose-500/70">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" aria-hidden="true" />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-rose-600/90 text-white shadow-lg">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          </span>
        </span>
        <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-white">
          {video.censored ? 'CENS' : 'UNCENS'}
        </span>
        {badge && (
          <span className="absolute right-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black">
            {badge}
          </span>
        )}
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-between font-mono text-[10px] text-white/85">
          <span className="flex items-center gap-1">
            <Eye className="size-2.5" aria-hidden="true" /> {compactNumber(video.views)}
          </span>
          <span className="rounded bg-black/60 px-1.5 py-0.5">{shortDuration(video.durationMs)}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/90 transition group-hover:text-white">
          {video.name}
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{video.brand ?? '—'}</span>
      </span>
    </Link>
  )
}