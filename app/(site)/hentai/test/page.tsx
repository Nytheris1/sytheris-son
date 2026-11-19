'use client'

import { useState } from 'react'

export default function TestPage() {
  const [log, setLog] = useState<string[]>([])

  const cors = async () => {
    try {
      const res = await fetch('https://auth.hanime.tv/api/v11/handshake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-signature-version': 'web2',
          'x-signature': '0'.repeat(64),
          'x-time': String(Math.floor(Date.now() / 1000)),
          'x-csrf-token': 'x',
        },
        body: JSON.stringify({ token: 'x' }),
      })
      setLog((l) => [...l, 'CORS OK: ' + res.status + ' ' + (await res.text()).slice(0, 90)])
    } catch (err) {
      setLog((l) => [...l, 'CORS HATA: ' + (err instanceof Error ? err.message : String(err))])
    }
  }

  const script = () => {
    const s = document.createElement('script')
    s.src = 'https://hanime-cdn.com/js/vendor.6cb274d12de4872d245a5bc7781bdc5e.min.js'
    s.onload = () => setLog((l) => [...l, 'BETIK YUKLENDI, wasmReady: ' + String((window as never as Record<string, unknown>).wasmReady)])
    s.onerror = () => setLog((l) => [...l, 'BETIK YUKLENEMEDI'])
    document.head.appendChild(s)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">hanime tanilama</h1>
      <div className="flex gap-2">
        <button onClick={cors} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">CORS testi</button>
        <button onClick={script} className="rounded-full border border-border px-4 py-2 text-sm">Betik testi</button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-border p-4 text-xs">{log.join('\n') || 'sonuc yok'}</pre>
    </div>
  )
}