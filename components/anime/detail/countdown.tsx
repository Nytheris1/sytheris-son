'use client'

import { useEffect, useState } from 'react'

function parts(sec: number) {
  const s = Math.max(0, sec)
  return [
    { label: 'gün', value: Math.floor(s / 86400) },
    { label: 'saat', value: Math.floor((s % 86400) / 3600) },
    { label: 'dk', value: Math.floor((s % 3600) / 60) },
    { label: 'sn', value: Math.floor(s % 60) },
  ]
}

export function Countdown({ episode, airingAt }: { episode: number; airingAt: number }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const remaining = now === null ? null : airingAt - Math.floor(now / 1000)
  const date = new Date(airingAt * 1000).toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex w-fit flex-wrap items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.05] p-3 pr-5 backdrop-blur-md">
      <span className="flex flex-col gap-0.5 pl-1">
        <span className="label-mono text-[9px] text-primary">Sıradaki bölüm</span>
        <span className="text-sm font-medium">
          {episode}. bölüm · <span className="text-foreground/60">{date}</span>
        </span>
      </span>
      <span className="flex items-center gap-1.5" aria-live="off">
        {(remaining === null ? parts(0) : parts(remaining)).map((p) => (
          <span key={p.label} className="flex min-w-11 flex-col items-center rounded-xl bg-scrim/50 px-2 py-1.5">
            <span className="font-mono text-base font-semibold tabular-nums leading-none">{remaining === null ? '--' : String(p.value).padStart(2, '0')}</span>
            <span className="mt-1 text-[9px] uppercase tracking-wider text-foreground/50">{p.label}</span>
          </span>
        ))}
      </span>
    </div>
  )
}
