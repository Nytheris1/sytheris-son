import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="dark relative grid min-h-dvh place-items-center overflow-hidden bg-scrim px-6 text-foreground">
      <div className="grain absolute inset-0" />
      <span aria-hidden="true" className="text-stroke pointer-events-none absolute select-none text-[38vw] font-bold leading-none tracking-tighter opacity-30">
        404
      </span>
      <div className="relative flex max-w-lg flex-col items-center gap-5 text-center">
        <p className="label-mono text-primary">Kayıp bölüm</p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Bu sayfa başka bir <span className="font-serif font-normal italic text-primary">evrende</span>
        </h1>
        <p className="leading-relaxed text-foreground/65">Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground">
            <ArrowLeft className="size-4" /> Ana sayfa
          </Link>
          <Link href="/ara" className="flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-6 font-medium transition hover:bg-foreground/10">
            <Search className="size-4" /> Anime ara
          </Link>
        </div>
      </div>
    </main>
  )
}
