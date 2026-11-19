'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Bookmark, BookmarkCheck, ChevronDown, Link2, Loader2, Play, Plus, Radar, ShieldCheck, Trash2, Tv } from 'lucide-react'
import { toast } from 'sonner'
import { attachVaultAction, deleteVaultAction, huntAction, saveVaultAction, type HuntCandidateView, type HuntResponse } from '@/app/sy-core/hunter-actions'
import { pickTitle } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card } from '@/components/settings/settings-panel'
import { AnimePicker } from '@/components/compare/compare-picker'
import { VaultPlayer } from './vault-player'

export type VaultView = { id: string; label: string; host: string; pageUrl: string; kind: 'hls' | 'mp4'; quality: string | null; by: string; createdAt: number; preview: string }

const field = 'h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary'

function formatBytes(n: number | null) {
  if (!n) return null
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function shortPath(url: string) {
  try {
    const u = new URL(url)
    const file = u.pathname.split('/').filter(Boolean).slice(-2).join('/')
    return `${u.hostname}/…/${file}`
  } catch {
    return url
  }
}

function KindBadge({ kind }: { kind: 'hls' | 'mp4' }) {
  return (
    <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider', kind === 'hls' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background')}>
      {kind === 'hls' ? 'm3u8' : 'mp4'}
    </span>
  )
}

function Elapsed({ running }: { running: boolean }) {
  const [s, setS] = useState(0)
  useEffect(() => {
    if (!running) return
    setS(0)
    const t = window.setInterval(() => setS((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  return <span className="tabular-nums">{s} sn</span>
}

export function MediaHunter({ vault }: { vault: VaultView[] }) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [hunting, startHunt] = useTransition()
  const [busy, startBusy] = useTransition()
  const [result, setResult] = useState<HuntResponse | null>(null)
  const [preview, setPreview] = useState<{ key: string; src: string; kind: 'hls' | 'mp4'; title: string } | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [attachFor, setAttachFor] = useState<string | null>(null)

  function hunt(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setPreview(null)
    startHunt(async () => {
      const res = await huntAction(url.trim())
      setResult(res)
      if (!res.ok) toast.error(res.error)
      else if (!res.candidates.length) toast.message('Sayfada mp4 / m3u8 bulunamadı', { description: 'Ayrıntılar için taranan sayfalara bak.' })
      else toast.success(`${res.candidates.length} kaynak bulundu`)
    })
  }

  function save(c: HuntCandidateView) {
    if (!result?.ok) return
    startBusy(async () => {
      const res = await saveVaultAction({ label: result.title ?? new URL(result.pageUrl).hostname, pageUrl: result.pageUrl, url: c.url, referer: c.referer, kind: c.kind, quality: c.quality })
      if (!res.ok) return void toast.error(res.error)
      setSaved((s) => new Set(s).add(c.url))
      toast.success('Kayıtlı kaynaklara eklendi')
      router.refresh()
    })
  }

  function remove(item: VaultView) {
    if (!confirm(`"${item.label}" kaynağı silinsin mi? Bu kaynağa bağlı bölümler oynamayı sürdürür.`)) return
    startBusy(async () => {
      const res = await deleteVaultAction(item.id)
      if (!res.ok) return void toast.error(res.error)
      if (preview?.key === item.id) setPreview(null)
      toast.success('Kaynak silindi')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Link avcısı" accent="mp4 · m3u8">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Bölüm sayfasının bağlantısını yapıştır. Sayfa, içindeki oynatıcılar (iframe), oynatıcı betikleri, paketlenmiş ve base64 ile gizlenmiş kaynaklar taranır; bulunan her
          bağlantı sunucuda doğrulanır. Kaydettiğin kaynaklar indirilmeden, imzalı bağlantıyla burada gömülü oynar.
        </p>

        <form onSubmit={hunt} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Bölüm sayfasının bağlantısı</span>
            <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="url"
              required
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://site.com/anime/bolum-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={cn(field, 'pl-11 font-mono')}
            />
          </label>
          <button
            type="submit"
            disabled={hunting}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-progress disabled:opacity-80"
          >
            {hunting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Radar className="size-4" aria-hidden="true" />}
            {hunting ? 'Taranıyor' : 'Kaynakları çek'}
          </button>
        </form>

        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-ink" aria-hidden="true" />
          Yalnızca yöneticiler · özel ağ adresleri engellenir · dakikada 12 tarama · tüm işlemler denetim kaydına yazılır
        </p>

        {hunting && (
          <div role="status" className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="relative h-1 bg-muted">
              <span className="absolute inset-y-0 left-0 w-1/3 animate-[hunt-scan_1.4s_ease-in-out_infinite] bg-primary" />
            </div>
            <p className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
              Sayfa ve gömülü oynatıcılar taranıyor… <Elapsed running={hunting} />
            </p>
          </div>
        )}

        {result && !hunting && (
          <div className="mt-6 flex flex-col gap-4">
            {result.ok && (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{result.title ?? new URL(result.pageUrl).hostname}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {result.candidates.length} kaynak · {result.pages.length} sayfa · {(result.tookMs / 1000).toFixed(1)} sn
                </span>
              </p>
            )}

            {preview && !vault.some((v) => v.id === preview.key) && <VaultPlayer src={preview.src} kind={preview.kind} title={preview.title} onClose={() => setPreview(null)} />}

            {result.ok && result.candidates.length > 0 && (
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {result.candidates.map((c) => {
                  const isSaved = saved.has(c.url) || vault.some((v) => v.preview === c.preview)
                  return (
                    <li key={c.url} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <KindBadge kind={c.kind} />
                          {c.quality && <span className="font-mono text-xs font-semibold">{c.quality}</span>}
                          <span className={cn('flex items-center gap-1 text-xs', c.probe?.ok ? 'text-ink' : 'text-muted-foreground')}>
                            <span className={cn('size-1.5 rounded-full', c.probe?.ok ? 'bg-primary' : c.probe ? 'bg-destructive' : 'bg-muted-foreground/40')} aria-hidden="true" />
                            {c.probe ? c.probe.note : 'Doğrulanmadı'}
                            {formatBytes(c.probe?.bytes ?? null) && ` · ${formatBytes(c.probe?.bytes ?? null)}`}
                          </span>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{c.via}</span>
                        </div>
                        <p className="truncate font-mono text-xs text-muted-foreground" title={c.url}>
                          {shortPath(c.url)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreview({ key: c.url, src: c.preview, kind: c.kind, title: `${c.quality ?? ''} ${shortPath(c.url)}`.trim() })}
                          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition hover:border-primary"
                        >
                          <Play className="size-3.5" aria-hidden="true" /> Önizle
                        </button>
                        <button
                          type="button"
                          onClick={() => save(c)}
                          disabled={busy || isSaved}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
                        >
                          {isSaved ? <BookmarkCheck className="size-3.5" aria-hidden="true" /> : <Bookmark className="size-3.5" aria-hidden="true" />}
                          {isSaved ? 'Kayıtlı' : 'Kaydet'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {result.ok && result.candidates.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-relaxed text-muted-foreground">
                Bu sayfanın kodunda oynatılabilir bir mp4 / m3u8 bağlantısı yok. Kaynak, sitenin kendi giriş, captcha ya da DRM adımından sonra oluşuyor olabilir. Oynatıcının açıldığı
                gömülü sayfanın (iframe) bağlantısını doğrudan yapıştırmayı dene.
              </p>
            )}

            {(result.ok ? result.pages : (result.pages ?? [])).length > 0 && (
              <details className="group rounded-2xl border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
                  Taranan sayfalar
                  <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="flex flex-col divide-y divide-border border-t border-border font-mono text-xs">
                  {(result.ok ? result.pages : (result.pages ?? [])).map((p, i) => (
                    <li key={`${p.url}-${i}`} className="flex items-center gap-3 px-4 py-2" style={{ paddingLeft: `${1 + p.depth * 1.25}rem` }}>
                      <span className={cn('w-9 shrink-0', p.status >= 200 && p.status < 400 ? 'text-ink' : 'text-destructive')}>{p.status || '—'}</span>
                      <span className="min-w-0 flex-1 truncate" title={p.url}>
                        {p.url}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{p.note}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Card>

      <Card title="Kayıtlı" accent="kaynaklar">
        {vault.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Henüz kaydedilmiş kaynak yok. Yukarıdan bir bölüm sayfası tarayıp bulduklarını kaydet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {vault.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex items-center gap-2">
                      <KindBadge kind={item.kind} />
                      {item.quality && <span className="font-mono text-xs font-semibold">{item.quality}</span>}
                      <span className="truncate font-medium">{item.label}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.host} · {item.by} · {new Date(item.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(preview?.key === item.id ? null : { key: item.id, src: item.preview, kind: item.kind, title: item.label })}
                      className={cn('flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition', preview?.key === item.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary')}
                    >
                      <Tv className="size-3.5" aria-hidden="true" /> {preview?.key === item.id ? 'Kapat' : 'İzle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachFor(attachFor === item.id ? null : item.id)}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition hover:border-primary"
                    >
                      <Plus className="size-3.5" aria-hidden="true" /> Bölüme ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={busy}
                      className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`${item.label} kaynağını sil`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {preview?.key === item.id && <VaultPlayer src={item.preview} kind={item.kind} title={item.label} />}
                {attachFor === item.id && <AttachForm item={item} onDone={() => setAttachFor(null)} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function AttachForm({ item, onDone }: { item: VaultView; onDone: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [anime, setAnime] = useState<{ id: number; title: string; cover: string | null } | null>(null)
  const [number, setNumber] = useState(1)
  const [title, setTitle] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!anime) return void toast.error('Önce bir anime seç')
    start(async () => {
      const res = await attachVaultAction({ id: item.id, animeId: anime.id, animeTitle: anime.title, animeCover: anime.cover, number, title })
      if (!res.ok) return void toast.error(res.error)
      toast.success(`${anime.title} · ${number}. bölüme bağlandı`)
      router.refresh()
      onDone()
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4">
      <AnimePicker label="Anime adı yaz ve seç" value={anime} onPick={(m) => setAnime(m ? { id: m.id, title: pickTitle(m.title), cover: m.coverImage.large ?? null } : null)} />
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Bölüm no
          <input type="number" min={1} max={5000} required value={number} onChange={(e) => setNumber(Number(e.target.value))} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Bölüm başlığı (opsiyonel)
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <button type="submit" disabled={pending} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-70">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Bağla
        </button>
      </div>
    </form>
  )
}
