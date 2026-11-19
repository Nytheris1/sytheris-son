'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MASCOT, type MascotMood } from '@/components/mascot/mascot-config'
import { AvatarFrame } from '@/components/membership/avatar-frame'

const SLOTS: { id: MascotMood; label: string }[] = [
  { id: 'wave', label: 'El sallayan' },
  { id: 'lost', label: 'Kaybolmuş' },
  { id: 'secret', label: 'Sır veren' },
  { id: 'think', label: 'Düşünen' },
  { id: 'portrait', label: 'Portre' },
  { id: 'avatar', label: 'Avatar (kare)' },
]

/** Local-only preview: the chosen file never leaves the browser (object URL). */
export function MascotTester() {
  const [src, setSrc] = useState<string | null>(null)
  const [slot, setSlot] = useState<MascotMood>('wave')
  const [meta, setMeta] = useState<{ name: string; w: number; h: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src])

  const pick = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setMeta({ name: file.name, w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    setSrc(url)
  }

  const shown = src ?? MASCOT.images[slot]
  const target = MASCOT.images[slot]
  const ratio = meta ? meta.w / meta.h : null
  const ratioHint = !meta ? null : slot === 'avatar' ? (Math.abs((ratio ?? 1) - 1) < 0.08 ? 'Kare — tam uygun.' : 'Avatar için kare (1:1) bir görsel önerilir.') : (ratio ?? 1) < 0.95 ? 'Dikey — tam uygun.' : 'Dikey (yaklaşık 3:4) bir görsel daha iyi oturur.'

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Hangi hâli deniyorsun?">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={slot === s.id} onClick={() => setSlot(s.id)} className={cn('rounded-full border px-3.5 py-1.5 text-sm transition', slot === s.id ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="dark relative grid h-72 place-items-end overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_70%,color-mix(in_oklch,var(--primary)_40%,var(--scrim)),var(--scrim)_70%)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown || '/placeholder.svg'} alt="Tam boy önizleme" className="h-full w-full object-contain object-bottom drop-shadow-[0_24px_30px_rgb(0_0_0/0.4)]" />
          <span className="absolute left-3 top-3 rounded-full bg-scrim/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-on-scrim">Tam boy</span>
        </div>
        <div className="relative h-72 overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown || '/placeholder.svg'} alt="Portre kırpımı önizleme" className="size-full object-cover object-top" />
          <span className="absolute left-3 top-3 rounded-full bg-scrim/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-on-scrim">Portre</span>
        </div>
        <div className="flex h-72 flex-col items-center justify-center gap-8 rounded-2xl border border-border bg-background">
          <AvatarFrame src={shown} name={MASCOT.name} frame="ribbon" className="size-24" />
          <AvatarFrame src={shown} name={MASCOT.name} frame="none" className="size-10" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Avatar boyutları</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
            <ImageUp className="size-4" /> Görsel seç ve dene
          </button>
          {src && (
            <button
              type="button"
              onClick={() => {
                setSrc(null)
                setMeta(null)
              }}
              className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm transition hover:border-foreground/40"
            >
              <RotateCcw className="size-4" /> Mevcut maskota dön
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept="image/png,image/webp,image/jpeg,image/gif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) pick(f)
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {meta ? (
            <>
              <span className="font-medium text-foreground">{meta.name}</span> · {meta.w}×{meta.h}px · {ratioHint}
            </>
          ) : (
            'Görsel yalnızca tarayıcında gösterilir, hiçbir yere yüklenmez.'
          )}
        </p>
      </div>

      <p className="rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed">
        Beğendiysen bu dosyayı projede <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">public{target}</code> adıyla kaydet (eskisinin üzerine yaz). Farklı bir isim kullanacaksan <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">components/mascot/mascot-config.ts</code> içindeki <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">{slot}</code> satırını değiştir.
      </p>
    </div>
  )
}
