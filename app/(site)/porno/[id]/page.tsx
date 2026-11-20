import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { pageUrl, type Src } from '@/lib/porn'
import { PornPlayer } from '@/components/porn/porn-player'

export const metadata: Metadata = { title: 'Izle', robots: { index: false, follow: false } }

export default async function PornoWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string; p?: string; src?: string }>
}) {
  const { id } = await params
  const { t, p, src } = await searchParams
  const title = (t || '').trim() || 'Video'
  const path = (p || '').trim()
  const source = ((src || 'ph') as Src)

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6 lg:px-10">
        <Link href="/porno" className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 hover:text-white">- Porno</Link>
        <h1 className="mt-3 mb-4 text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        <PornPlayer id={id} path={path} src={source} title={title} />
        <a
          href={pageUrl(source, path)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs"
        >
          xnxx.com <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}