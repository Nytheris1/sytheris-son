'use client'

import { useState } from 'react'

export default function TestPage() {
  const [log, setLog] = useState<string[]>([])

  const run = async (label: string, fn: () => Promise<Response>) => {
    try {
      const res = await fn()
      const acao = res.headers.get('access-control-allow-origin')
      const body = (await res.text()).slice(0, 70)
      setLog((l) => [...l, label + ' -> ' + res.status + ' acao=' + String(acao) + ' ' + body])
    } catch (err) {
      setLog((l) => [...l, label + ' -> AG HATASI: ' + (err instanceof Error ? err.message : String(err))])
    }
  }

  const getGuest = () =>
    run('GET guest katalog', () =>
      fetch('https://guest.freeanimehentai.net/api/v11/search_hvs', { cache: 'no-store' }),
    )

  const postSimple = () =>
    run('POST auth text/plain', () =>
      fetch('https://auth.hanime.tv/api/v11/handshake', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{"token":"x"}',
      }),
    )

  const options = () =>
    run('OPTIONS auth', () =>
      fetch('https://auth.hanime.tv/api/v11/handshake', { method: 'OPTIONS' }),
    )

  const postTo = (label: string, base: string) =>
    run(label, () =>
      fetch(base + '/api/v11/handshake', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{"token":"x"}',
      }),
    )

  const getCsrf = () =>
    run('GET ct csrf', () => fetch('https://ct.hanime.tv/csrf-token', { cache: 'no-store' }))

  const script = () => {
    const s = document.createElement('script')
    s.src = 'https://hanime-cdn.com/js/vendor.6cb274d12de4872d245a5bc7781bdc5e.min.js'
    s.onload = () => setLog((l) => [...l, 'BETIK YUKLENDI'])
    s.onerror = () => setLog((l) => [...l, 'BETIK YUKLENEMEDI'])
    document.head.appendChild(s)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">hanime tanilama</h1>
      <div className="flex flex-wrap gap-2">
        <button onClick={getGuest} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">1 GET katalog</button>
        <button onClick={postSimple} className="rounded-full border border-border px-4 py-2 text-sm">2 POST basit</button>
        <button onClick={options} className="rounded-full border border-border px-4 py-2 text-sm">3 OPTIONS</button>
        <button onClick={script} className="rounded-full border border-border px-4 py-2 text-sm">4 Betik</button>
        <button onClick={() => postTo('5 POST guest', 'https://guest.freeanimehentai.net')} className="rounded-full border border-border px-4 py-2 text-sm">5 POST guest</button>
        <button onClick={() => postTo('6 POST hanime.tv', 'https://hanime.tv')} className="rounded-full border border-border px-4 py-2 text-sm">6 POST hanime</button>
        <button onClick={getCsrf} className="rounded-full border border-border px-4 py-2 text-sm">7 GET csrf</button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-border p-4 text-xs">{log.join('\n') || 'sonuc yok'}</pre>
    </div>
  )
}