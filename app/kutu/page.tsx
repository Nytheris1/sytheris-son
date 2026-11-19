import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InboxUploader } from '@/components/inbox/inbox-uploader'

/*
 * GEÇİCİ REFERANS KUTUSU — işin bitince sil:
 *   app/kutu/   app/api/kutu/   components/inbox/   lib/inbox.ts
 */

export const metadata: Metadata = {
  title: 'Referans kutusu',
  robots: { index: false, follow: false, nocache: true },
}

export default function InboxPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Siteye dön">
            <ArrowLeft className="size-4 text-muted-foreground" />
            <span className="text-[17px] font-bold tracking-[-0.02em]">SYTHERIS</span>
          </Link>
          <span className="rounded-full border border-dashed border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gizli · geçici · /kutu</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 px-4 pb-24 pt-12 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" />
            Referans kutusu
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Fotoğraf, video ve pinleri <span className="accent-serif">buraya bırak</span>
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Fotoğraf ve MP4 yükleyebilir ya da Pinterest bağlantısı yapıştırabilirsin — pin videoysa video, fotoğrafsa fotoğraf olarak gelir. Her şeyi kategorilere
            ayır, sonra sohbete &quot;kutuya attım&quot; yaz. Dosyalar yalnızca sunucunun geçici klasöründe durur; siteye, repoya ya da ZIP&apos;e girmez.
          </p>
        </div>
        <InboxUploader />
      </main>
    </div>
  )
}
