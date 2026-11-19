import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { embedUrl } from '@/lib/eporner'
import { PornPlayer } from '@/components/porn/porn-player'

export const metadata: Metadata = { title: 'Izle', robots: { index: false, follow: false } }

export default async function PornoWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams
  const src = embedUrl(id)
  const title = (t || '').trim() || 'Video'

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6 lg:px-10">
        <Link href="/porno" className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 hover:text-white">- Porno</Link>
<div className="mt-4">
          <PornPlayer id={id} title={title} />
        </div>
        <a href={'https://www.eporner.com/video-' + id + '/'} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs">
          eporner.com <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}