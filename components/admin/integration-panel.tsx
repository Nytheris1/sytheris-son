'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Copy, Loader2, PlayCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { testIntegration } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { Card } from '@/components/settings/settings-panel'
import { BrandIcon } from '@/components/ui-kit/brand-icon'

type Group = { title: string; vars: { key: string; note: string; required?: boolean; set: boolean }[] }
type Result = { ok: boolean; ms: number; detail?: string }

const SERVICES = [
  { id: 'anilist', label: 'AniList API', note: 'Anime verileri' },
  { id: 'animethemes', label: 'AnimeThemes', note: 'OP / ED müzikleri' },
  { id: 'store', label: 'Veri deposu', note: 'Kullanıcı, video, ayar' },
  { id: 'gemini', label: 'Google Gemini', note: 'Bulut yapay zekâ' },
  { id: 'ollama', label: 'Ollama (sunucu)', note: 'Yerel yapay zekâ' },
] as const

export function IntegrationPanel({ groups, providers, origin }: { groups: Group[]; providers: { id: string; label: string; configured: boolean }[]; origin: string }) {
  const [results, setResults] = useState<Record<string, Result>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [, start] = useTransition()

  const run = (id: (typeof SERVICES)[number]['id']) => {
    setRunning(id)
    start(async () => {
      const r = await testIntegration(id)
      setResults((x) => ({ ...x, [id]: r }))
      setRunning(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Servis" accent="durumu">
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => SERVICES.forEach((s, i) => window.setTimeout(() => run(s.id), i * 300))} className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm transition hover:border-primary">
            <PlayCircle className="size-4" /> Tümünü test et
          </button>
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {SERVICES.map((s) => {
            const r = results[s.id]
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={cn('size-2.5 rounded-full', !r ? 'bg-muted-foreground/40' : r.ok ? 'bg-primary shadow-[0_0_10px_var(--primary)]' : 'bg-destructive')} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{r?.detail ?? s.note}</span>
                </span>
                {r && <span className="font-mono text-xs text-muted-foreground">{r.ms}ms</span>}
                <button type="button" onClick={() => run(s.id)} disabled={running === s.id} className="flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium transition hover:bg-accent">
                  {running === s.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Test et
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Giriş" accent="sağlayıcıları">
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Her sağlayıcının geliştirici panelinde aşağıdaki yönlendirme (callback) adresini ekleyin, ardından istemci kimliği ve gizli anahtarı ortam değişkeni olarak girin.</p>
        <ul className="mt-4 flex flex-col gap-3">
          {providers.map((p) => {
            const cb = `${origin}/api/auth/${p.id}/callback`
            return (
              <li key={p.id} className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <BrandIcon name={p.id} />
                  <span className="flex-1 font-medium">{p.label}</span>
                  <span className={cn('flex items-center gap-1 text-xs', p.configured ? 'text-ink' : 'text-destructive')}>
                    {p.configured ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                    {p.configured ? 'Hazır' : 'Eksik'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(cb)
                    toast.success('Callback adresi kopyalandı')
                  }}
                  className="flex items-center gap-2 truncate rounded-xl bg-muted px-3 py-2 text-left font-mono text-xs transition hover:bg-accent"
                >
                  <Copy className="size-3.5 shrink-0" />
                  <span className="truncate">{cb}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="Ortam" accent="değişkenleri">
        <div className="mt-4 flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="label-mono mb-2 text-[10px] text-muted-foreground">{g.title}</p>
              <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
                {g.vars.map((v) => (
                  <li key={v.key} className="flex items-center gap-3 px-4 py-3">
                    {v.set ? <CheckCircle2 className="size-4 shrink-0 text-ink" /> : <XCircle className={cn('size-4 shrink-0', v.required ? 'text-destructive' : 'text-muted-foreground')} />}
                    <code className="font-mono text-sm">{v.key}</code>
                    <span className="ml-auto hidden text-right text-xs text-muted-foreground sm:inline">{v.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs leading-relaxed text-muted-foreground">Değişkenleri v0 içinde sağ üstteki ayarlar menüsünden &quot;Vars&quot; bölümüne ya da Vercel proje ayarlarına ekleyebilirsiniz. Değerler güvenlik nedeniyle burada gösterilmez.</p>
        </div>
      </Card>
    </div>
  )
}
