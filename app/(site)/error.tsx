'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { LostScene } from '@/components/mascot/lost-scene'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message || 'Sayfa hatası', stack: `${error.stack ?? ''}\ndigest: ${error.digest ?? '-'}`, path: location.pathname }),
    }).catch(() => {})
  }, [error])

  return (
    <LostScene
      embedded
      code="500"
      word="TERS GİTTİ"
      mood="think"
      title="Bir şeyler"
      accent="ters gitti."
      message={`Hata kaydedildi ve yöneticiye iletildi. Syra bakıyor; sen de sayfayı yeniden deneyebilirsin.${error.digest ? ` (kod: ${error.digest})` : ''}`}
      primaryAction={
        <button type="button" onClick={reset} className="group flex flex-col gap-1.5 py-4 text-left outline-none sm:px-6 sm:py-0">
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-on-scrim transition group-hover:text-ink">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Tekrar dene
          </span>
          <span className="text-sm text-on-scrim/55">Sayfayı yeniden yükle</span>
        </button>
      }
    />
  )
}
