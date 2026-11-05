'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Sayfa hatası', stack: `${error.stack ?? ''}\ndigest: ${error.digest ?? '-'}`, path: location.pathname }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
      <p className="label-mono text-ink">Beklenmeyen hata</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Bir şeyler <span className="accent-serif">ters gitti</span>
      </h1>
      <p className="leading-relaxed text-muted-foreground">Hata kaydedildi ve yöneticiye iletildi. Sayfayı yeniden denemek ister misin?</p>
      <button type="button" onClick={reset} className="mt-2 flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground">
        <RotateCcw className="size-4" /> Tekrar dene
      </button>
    </div>
  )
}
