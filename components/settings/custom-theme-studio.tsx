'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Loader2, Lock, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCustomTheme, saveCustomTheme } from '@/app/actions/themes'
import { CUSTOM_THEME_LIMIT, HEX_RE, customThemeVars, hexToOklch, oklchToHex, sanitizeThemeName, type CustomTheme } from '@/lib/custom-theme'
import type { Tier } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { Card } from './settings-panel'

const SWATCHES = [
  { name: 'Gece Mavisi', hex: '#3d5afe' },
  { name: 'Kan Ayı', hex: '#c62839' },
  { name: 'Yeşim', hex: '#14b38a' },
  { name: 'Şafak', hex: '#ff8a3d' },
  { name: 'Lavanta', hex: '#9b7bff' },
  { name: 'Kiraz', hex: '#ff5fa2' },
  { name: 'Limon', hex: '#d9e021' },
  { name: 'Okyanus', hex: '#0ea5c6' },
]

function Slider({ label, value, min, max, step, onChange, track, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; track: string; format: (v: number) => string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{format(value)}</span>
      </span>
      <span className="relative flex h-6 items-center">
        <span aria-hidden="true" className="absolute inset-x-0 h-3 rounded-full ring-1 ring-foreground/10" style={{ background: track }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="sy-range relative w-full" aria-label={label} />
      </span>
    </label>
  )
}

function Preview({ hex, name }: { hex: string; name: string }) {
  const { dark } = useTheme()
  const base = customThemeVars(hex)
  const vars = {
    ...base,
    '--ink': dark ? base['--ink-dark'] : base['--ink-light'],
    '--accent': dark ? `oklch(0.26 calc(${base['--chroma']} * 0.2) ${base['--hue']})` : `oklch(0.94 calc(${base['--chroma']} * 0.12) ${base['--hue']})`,
  } as React.CSSProperties
  return (
    <div style={vars} className="relative overflow-hidden rounded-3xl border border-border bg-background p-5">
      <div aria-hidden="true" className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight">
          SYTHERIS
          <span className="block font-mono text-[8px] font-semibold uppercase tracking-[0.3em] text-ink">{name || 'Adsız tema'}</span>
        </span>
        <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      </div>
      <p className="relative mt-6 text-2xl font-semibold leading-tight tracking-tight">
        Bu akşam <span className="accent-serif">ne izliyoruz?</span>
      </p>
      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Hemen izle</span>
        <span className="rounded-full border border-primary/50 px-4 py-2 text-sm text-ink">Listeme ekle</span>
      </div>
      <div className="relative mt-5 flex items-center gap-3">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full w-2/3 rounded-full bg-primary" />
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">12:40</span>
      </div>
      <div className="relative mt-4 flex gap-1.5">
        {['Aksiyon', 'Fantastik', 'Dram'].map((g, i) => (
          <span key={g} className={cn('rounded-full px-2.5 py-1 text-[11px]', i === 0 ? 'bg-accent text-ink' : 'bg-muted text-muted-foreground')}>
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

export function CustomThemeStudio({ tier, loggedIn, initialThemes }: { tier: Tier; loggedIn: boolean; initialThemes: CustomTheme[] }) {
  const { custom, applyCustom } = useTheme()
  const [themes, setThemes] = useState(initialThemes)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const start = hexToOklch('#3d5afe')
  const [lch, setLch] = useState({ l: start.l, c: start.c, h: start.h })
  const [hexInput, setHexInput] = useState('#3d5afe')
  const [pending, startTransition] = useTransition()
  const unlocked = loggedIn && tier !== 'free'
  const hex = oklchToHex(lch.l, lch.c, lch.h)

  const setFromHex = (value: string) => {
    setHexInput(value)
    if (HEX_RE.test(value)) {
      const o = hexToOklch(value)
      setLch({ l: o.l, c: o.c, h: o.h })
    }
  }
  const setChannel = (patch: Partial<typeof lch>) => {
    const next = { ...lch, ...patch }
    setLch(next)
    setHexInput(oklchToHex(next.l, next.c, next.h))
  }

  function save(e: React.MouseEvent) {
    const origin = { x: e.clientX, y: e.clientY }
    const finalName = sanitizeThemeName(name)
    if (finalName.length < 2) {
      toast.error('Temana en az 2 karakterlik bir isim ver.')
      return
    }
    startTransition(async () => {
      const r = await saveCustomTheme({ id: editing ?? undefined, name: finalName, hex })
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      setThemes(r.themes)
      if (r.theme) applyCustom(r.theme, origin)
      setEditing(null)
      toast.success(`“${finalName}” uygulandı`, { description: 'Tüm sitede, bu ve diğer cihazlarında seninle.' })
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteCustomTheme(id)
      if (r.ok) {
        setThemes(r.themes)
        toast.success('Tema silindi')
      } else toast.error(r.error)
    })
  }

  function edit(t: CustomTheme) {
    setEditing(t.id)
    setName(t.name)
    setFromHex(t.hex)
  }

  return (
    <Card title="Özel tema" accent="stüdyosu">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Kendi rengini karıştır, adını koy. Butonlardan vurgulara kadar her şey senin renginle yeniden boyanır; kontrast otomatik ayarlanır.</p>
        <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          <Sparkles className="size-3" aria-hidden="true" /> Sytheris+
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Tema adı</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="ör. Gece Yarısı Neonu"
              className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-foreground/10" style={{ background: hex }}>
              <span className="sr-only">Renk seçici</span>
              <input type="color" value={hex} onChange={(e) => setFromHex(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">Renk kodu</span>
              <input
                value={hexInput}
                onChange={(e) => setFromHex(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)}
                maxLength={7}
                spellCheck={false}
                aria-invalid={!HEX_RE.test(hexInput)}
                className="h-11 rounded-xl border border-border bg-background px-3.5 font-mono text-sm uppercase outline-none transition focus:border-primary aria-[invalid=true]:border-destructive"
              />
            </label>
          </div>

          <Slider label="Ton" value={Math.round(lch.h)} min={0} max={359} step={1} onChange={(h) => setChannel({ h })} format={(v) => `${v}°`} track="linear-gradient(90deg, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 359))" />
          <Slider label="Canlılık" value={Math.round(lch.c * 1000) / 1000} min={0.02} max={0.3} step={0.005} onChange={(c) => setChannel({ c })} format={(v) => `${Math.round((v / 0.3) * 100)}%`} track={`linear-gradient(90deg, oklch(${lch.l} 0 ${lch.h}), oklch(${lch.l} 0.3 ${lch.h}))`} />
          <Slider label="Parlaklık" value={Math.round(lch.l * 100) / 100} min={0.35} max={0.92} step={0.01} onChange={(l) => setChannel({ l })} format={(v) => `${Math.round(v * 100)}%`} track={`linear-gradient(90deg, oklch(0.35 ${lch.c} ${lch.h}), oklch(0.92 ${lch.c} ${lch.h}))`} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Hazır başlangıçlar</span>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => {
                    setFromHex(s.hex)
                    if (!name) setName(s.name)
                  }}
                  title={s.name}
                  aria-label={`${s.name} rengiyle başla`}
                  className="size-8 rounded-full ring-2 ring-background transition hover:scale-110 focus-visible:ring-primary"
                  style={{ background: s.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Preview hex={hex} name={sanitizeThemeName(name)} />
          {unlocked ? (
            <button
              type="button"
              onClick={save}
              disabled={pending || !HEX_RE.test(hexInput)}
              className="flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition hover:brightness-110 disabled:opacity-50"
              style={{ background: hex, color: customThemeVars(hex)['--primary-foreground'] }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              {editing ? 'Güncelle ve uygula' : 'Kaydet ve uygula'}
            </button>
          ) : (
            <Link href={loggedIn ? '/abonelik' : '/giris'} className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition hover:opacity-90">
              <Lock className="size-4" aria-hidden="true" />
              {loggedIn ? 'Sytheris+ ile kilidi aç' : 'Giriş yap ve kilidi aç'}
            </Link>
          )}
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Düzenlemeyi bırak, yeni tema oluştur
            </button>
          )}
        </div>
      </div>

      {unlocked && (
        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Temaların</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {themes.length} / {CUSTOM_THEME_LIMIT}
            </p>
          </div>
          {themes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Henüz bir tema kaydetmedin. Yukarıda rengini seç ve ilk temanı oluştur.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {themes.map((t) => {
                  const active = custom?.id === t.id
                  return (
                    <motion.li key={t.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className={cn('group flex items-center gap-3 rounded-2xl border p-2 pr-2.5 transition', active ? 'border-primary bg-accent' : 'border-border hover:border-foreground/20')}>
                      <button type="button" onClick={(e) => applyCustom(t, { x: e.clientX, y: e.clientY })} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-pressed={active}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: t.hex }}>
                          {active && <Check className="size-4" style={{ color: customThemeVars(t.hex)['--primary-foreground'] }} aria-hidden="true" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{t.name}</span>
                          <span className="block font-mono text-[10px] uppercase text-muted-foreground">{t.hex}</span>
                        </span>
                      </button>
                      <button type="button" onClick={() => edit(t)} aria-label={`${t.name} temasını düzenle`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => remove(t.id)} aria-label={`${t.name} temasını sil`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
