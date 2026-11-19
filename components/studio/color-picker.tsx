'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { hexToHsv, hsvToHex, isHex } from '@/lib/studio/engine'
import { cn } from '@/lib/utils'

const PALETTE = ['#111014', '#f5f1ea', '#e83f3f', '#f28c28', '#f6d04d', '#3fbf74', '#2aa6c9', '#3a5bd9', '#8a4fd8', '#e05aa8', '#8b5a3c', '#f2c9a5', '#7a8796', '#c9d1d9']

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    onMove(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
  }
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      handle(e)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (e.buttons) handle(e)
    },
  }
}

export function ColorPicker({
  color,
  secondary,
  recent,
  onChange,
  onSwap,
}: {
  color: string
  secondary: string
  recent: string[]
  onChange: (hex: string) => void
  onSwap: () => void
}) {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(color))
  const [draft, setDraft] = useState(color)
  const lastEmitted = useRef(color)

  useEffect(() => {
    if (color === lastEmitted.current) return
    lastEmitted.current = color
    setHsv(hexToHsv(color))
    setDraft(color)
  }, [color])

  const emit = (next: [number, number, number]) => {
    setHsv(next)
    const hex = hsvToHex(next[0], next[1], next[2])
    lastEmitted.current = hex
    setDraft(hex)
    onChange(hex)
  }

  const sv = useDrag((x, y) => emit([hsv[0], x, 1 - y]))
  const hue = useDrag((x) => emit([x * 360, hsv[1], hsv[2]]))

  const onKeySV = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 0.1 : 0.02
    if (e.key === 'ArrowRight') emit([hsv[0], Math.min(1, hsv[1] + d), hsv[2]])
    else if (e.key === 'ArrowLeft') emit([hsv[0], Math.max(0, hsv[1] - d), hsv[2]])
    else if (e.key === 'ArrowUp') emit([hsv[0], hsv[1], Math.min(1, hsv[2] + d)])
    else if (e.key === 'ArrowDown') emit([hsv[0], hsv[1], Math.max(0, hsv[2] - d)])
    else return
    e.preventDefault()
  }
  const onKeyHue = (e: React.KeyboardEvent) => {
    const d = e.shiftKey ? 15 : 3
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') emit([(hsv[0] + d) % 360, hsv[1], hsv[2]])
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') emit([(hsv[0] - d + 360) % 360, hsv[1], hsv[2]])
    else return
    e.preventDefault()
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        {...sv}
        role="slider"
        tabIndex={0}
        aria-label="Doygunluk ve parlaklık"
        aria-valuetext={`Doygunluk %${Math.round(hsv[1] * 100)}, parlaklık %${Math.round(hsv[2] * 100)}`}
        onKeyDown={onKeySV}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-xl outline-none ring-offset-2 ring-offset-card focus-visible:ring-2 focus-visible:ring-primary"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(hsv[0], 1, 1)})` }}
      >
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
          style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, background: color }}
        />
      </div>
      <div
        {...hue}
        role="slider"
        tabIndex={0}
        aria-label="Renk tonu"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv[0])}
        onKeyDown={onKeyHue}
        className="studio-hue relative h-3 w-full cursor-pointer touch-none rounded-full outline-none ring-offset-2 ring-offset-card focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]" style={{ left: `${(hsv[0] / 360) * 100}%`, background: hsvToHex(hsv[0], 1, 1) }} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative size-10 shrink-0">
          <span className="absolute bottom-0 right-0 size-6 rounded-md border border-border" style={{ background: secondary }} aria-hidden="true" />
          <span className="absolute left-0 top-0 size-7 rounded-md border-2 border-card shadow-sm" style={{ background: color }} aria-hidden="true" />
        </div>
        <button type="button" onClick={onSwap} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Ana ve ikincil rengi değiştir (X)" title="Değiştir (X)">
          <ArrowLeftRight className="size-4" />
        </button>
        <label className="sr-only" htmlFor="studio-hex">
          Renk kodu
        </label>
        <input
          id="studio-hex"
          value={draft}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value)
            const v = e.target.value.trim()
            if (isHex(v)) {
              const hex = (v.startsWith('#') ? v : `#${v}`).toLowerCase()
              lastEmitted.current = hex
              setHsv(hexToHsv(hex))
              onChange(hex)
            }
          }}
          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 font-mono text-xs uppercase outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Palet</span>
        <div className="grid grid-cols-7 gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn('aspect-square rounded-md border border-border transition hover:scale-110', c === color && 'ring-2 ring-primary ring-offset-1 ring-offset-card')}
              style={{ background: c }}
              aria-label={`Renk ${c}`}
            />
          ))}
        </div>
      </div>
      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Son kullanılanlar</span>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => (
              <button key={c} type="button" onClick={() => onChange(c)} className="size-6 rounded-full border border-border transition hover:scale-110" style={{ background: c }} aria-label={`Son renk ${c}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
