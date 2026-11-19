'use client'

import { useEffect, useState } from 'react'

const UNITS = [
  ['Gün', 86400],
  ['Saat', 3600],
  ['Dakika', 60],
  ['Saniye', 1],
] as const

function split(ms: number) {
  let s = Math.max(0, Math.floor(ms / 1000))
  return UNITS.map(([label, size]) => {
    const v = Math.floor(s / size)
    s -= v * size
    return [label, v] as const
  })
}

/** Live countdown to `target`; renders a dash grid until hydrated so server and client markup match. */
export function MaintenanceCountdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const parts = now === null ? UNITS.map(([l]) => [l, null] as const) : split(target - now)

  return (
    <dl className="grid grid-cols-4 gap-6 sm:gap-12" aria-live="off">
      {parts.map(([label, value]) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <dd className="mist-numeral text-5xl sm:text-7xl">{value === null ? '--' : String(value).padStart(2, '0')}</dd>
          <dt className="text-xs tracking-wide text-[var(--mist-soft)]">{label}</dt>
        </div>
      ))}
    </dl>
  )
}
