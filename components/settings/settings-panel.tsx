'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { setPrefs, usePrefs, type Prefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { ThemePanel } from '@/components/shell/theme-picker'

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-4">
      <span>
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute top-1 size-5 rounded-full bg-card shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </button>
    </label>
  )
}

export function Card({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-8">
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        {title} {accent && <span className="accent-serif text-2xl">{accent}</span>}
      </h2>
      {children}
    </section>
  )
}

export function SettingsPanel() {
  const prefs = usePrefs()
  const [test, setTest] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [models, setModels] = useState<string[]>([])

  async function testOllama() {
    setTest('loading')
    try {
      const res = await fetch(`${prefs.ollamaUrl.replace(/\/$/, '')}/api/tags`)
      const json = (await res.json()) as { models?: { name: string }[] }
      setModels(json.models?.map((m) => m.name) ?? [])
      setTest('ok')
    } catch {
      setTest('fail')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Tema ve" accent="görünüm">
        <p className="mb-5 text-sm text-muted-foreground">Bir renk seç; tüm vurgu yazıları ve butonlar bu renge göre değişir.</p>
        <ThemePanel />
      </Card>

      <Card title="Oynatma ve" accent="fragmanlar">
        <div className="divide-y divide-border">
          <Toggle checked={prefs.autoplayTrailers} onChange={(v) => setPrefs({ autoplayTrailers: v })} label="Fragmanları otomatik oynat" description="Kapakların üzerinde beklediğinde ve hero alanında fragman sessizce oynatılır." />
          <Toggle checked={prefs.trailerSound} onChange={(v) => setPrefs({ trailerSound: v })} label="Fragman sesi" description="Önizleme fragmanlarını sesli başlat." />
          <Toggle checked={prefs.intro} onChange={(v) => setPrefs({ intro: v })} label="Açılış animasyonu" description="Siteye her yeni oturumda girişte intro göster." />
          <Toggle checked={prefs.reduceMotion} onChange={(v) => setPrefs({ reduceMotion: v })} label="Hareketi azalt" description="Animasyonları ve geçişleri en aza indir." />
        </div>
      </Card>

      <Card title="Altyazı" accent="stili">
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-4 gap-2">
            {(['sm', 'md', 'lg', 'xl'] as Prefs['subtitleSize'][]).map((s) => (
              <button key={s} type="button" aria-pressed={prefs.subtitleSize === s} onClick={() => setPrefs({ subtitleSize: s })} className={cn('rounded-2xl border py-3 font-mono text-sm uppercase transition', prefs.subtitleSize === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
                {s}
              </button>
            ))}
          </div>
          <div className="dark grid aspect-[21/6] place-items-end justify-center rounded-2xl bg-scrim p-4">
            <span className={cn('text-center font-semibold text-on-scrim', prefs.subtitleBg ? 'rounded-md bg-black/70 px-3 py-1' : '[text-shadow:0_2px_4px_#000]', { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' }[prefs.subtitleSize])}>
              Bu bir altyazı önizlemesidir.
            </span>
          </div>
          <Toggle checked={prefs.subtitleBg} onChange={(v) => setPrefs({ subtitleBg: v })} label="Altyazı arka planı" />
        </div>
      </Card>

      <Card title="Yapay" accent="zekâ">
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Sytheris AI önce bilgisayarındaki Ollama&apos;yı dener; erişemezse sunucudaki Gemini API&apos;ye geçer. Ollama&apos;nın siteye erişebilmesi için Ollama&apos;yı{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">OLLAMA_ORIGINS=*</code> ortam değişkeniyle başlatman gerekir.
        </p>
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Sağlayıcı">
          {(
            [
              ['auto', 'Otomatik'],
              ['ollama', 'Önce Ollama'],
              ['gemini', 'Yalnız Gemini'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={prefs.aiProvider === v} onClick={() => setPrefs({ aiProvider: v })} className={cn('rounded-xl py-2.5 text-sm font-medium transition', prefs.aiProvider === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Ollama adresi</span>
            <input value={prefs.ollamaUrl} onChange={(e) => setPrefs({ ollamaUrl: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Model</span>
            {models.length ? (
              <select value={prefs.ollamaModel} onChange={(e) => setPrefs({ ollamaModel: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary">
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input value={prefs.ollamaModel} onChange={(e) => setPrefs({ ollamaModel: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary" />
            )}
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={testOllama} className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary">
            {test === 'loading' && <Loader2 className="size-4 animate-spin" />}
            Bağlantıyı test et
          </button>
          {test === 'ok' && (
            <span className="flex items-center gap-1.5 text-sm text-ink">
              <CheckCircle2 className="size-4" /> Ollama bağlı · {models.length} model
            </span>
          )}
          {test === 'fail' && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="size-4" /> Ulaşılamadı — Gemini kullanılacak
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}