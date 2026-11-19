'use client'

import { useState } from 'react'
import { ExternalLink, RotateCw, TriangleAlert } from 'lucide-react'

export function HanimePlayer({ slug, title }: { slug: string; title: string }) {
  const [reload, setReload] = useState(0)
  const external = 'https://hanime.tv/videos/hentai/' + slug
  const src = external + '?embed=1&r=' + reload

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
        <iframe
          key={slug + reload}
          src={src}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerPolicy="origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TriangleAlert className="size-3.5" />
          Gomulu oynatici acilmazsa yeni sekmede ac.
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
          >
            <RotateCw className="size-3.5" /> Yenile
          </button>
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            hanime.tv <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}