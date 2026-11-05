'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ExternalLink, Eye, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addEpisodeAction, deleteEpisodeAction } from '@/app/admin/actions'
import type { Episode } from '@/lib/site'
import { pickTitle } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card } from '@/components/settings/settings-panel'
import { AnimePicker } from '@/components/compare/compare-picker'

const field = 'h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary'

type CatalogItem = { animeId: number; title: string; cover?: string | null; count: number; episodes: Episode[] }

export function EpisodeManager({ catalog }: { catalog: CatalogItem[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [anime, setAnime] = useState<{ id: number; title: string; cover: string | null } | null>(null)
  const [subMode, setSubMode] = useState<'url' | 'text'>('url')
  const [preview, setPreview] = useState(false)
  const [f, setF] = useState({ number: 1, title: '', videoUrl: '', thumbnail: '', subtitleUrl: '', subtitleText: '', subtitleLang: 'tr' })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!anime) {
      toast.error('Önce bir anime seç')
      return
    }
    start(async () => {
      const res = await addEpisodeAction({
        animeId: anime.id,
        animeTitle: anime.title,
        animeCover: anime.cover,
        number: Number(f.number),
        title: f.title,
        videoUrl: f.videoUrl.trim(),
        thumbnail: f.thumbnail.trim(),
        subtitleUrl: subMode === 'url' ? f.subtitleUrl.trim() : '',
        subtitleText: subMode === 'text' ? f.subtitleText : '',
        subtitleLang: f.subtitleLang,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`${anime.title} · ${f.number}. bölüm eklendi`)
      setF((x) => ({ ...x, number: x.number + 1, title: '', videoUrl: '', thumbnail: '', subtitleUrl: '', subtitleText: '' }))
      setPreview(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Yeni bölüm" accent="ekle">
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Anime</span>
            <AnimePicker label="Anime adı yaz ve seç" value={anime} onPick={(m) => setAnime(m ? { id: m.id, title: pickTitle(m.title), cover: m.coverImage.large ?? null } : null)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Bölüm no</span>
              <input type="number" min={1} required className={field} value={f.number} onChange={(e) => setF({ ...f, number: Number(e.target.value) })} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Bölüm başlığı (opsiyonel)</span>
              <input className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Video bağlantısı (MP4 / WebM)</span>
            <div className="flex gap-2">
              <input type="url" required className={field} placeholder="https://…/bolum-1.mp4" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
              <button type="button" disabled={!f.videoUrl} onClick={() => setPreview((v) => !v)} className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-border px-4 text-sm transition hover:border-primary disabled:opacity-40">
                <Eye className="size-4" /> Test
              </button>
            </div>
          </label>
          {preview && f.videoUrl && (
            <video src={f.videoUrl} controls className="aspect-video w-full rounded-2xl bg-black" onError={() => toast.error('Video oynatılamadı: bağlantıyı kontrol et')} />
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Küçük resim (opsiyonel)</span>
            <input type="url" className={field} placeholder="https://…/kapak.jpg" value={f.thumbnail} onChange={(e) => setF({ ...f, thumbnail: e.target.value })} />
          </label>
          <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">Altyazı (SRT, VTT veya ASS)</span>
              <div className="flex items-center gap-2">
                <select aria-label="Altyazı dili" value={f.subtitleLang} onChange={(e) => setF({ ...f, subtitleLang: e.target.value })} className="h-9 rounded-xl border border-border bg-background px-2 text-sm">
                  <option value="tr">Türkçe</option>
                  <option value="en">İngilizce</option>
                  <option value="ja">Japonca</option>
                </select>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {(['url', 'text'] as const).map((m) => (
                    <button key={m} type="button" aria-pressed={subMode === m} onClick={() => setSubMode(m)} className={cn('rounded-lg px-3 py-1 text-xs transition', subMode === m ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                      {m === 'url' ? 'Bağlantı' : 'Metin yapıştır'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {subMode === 'url' ? (
              <input type="url" className={field} placeholder="https://…/bolum-1.tr.srt" value={f.subtitleUrl} onChange={(e) => setF({ ...f, subtitleUrl: e.target.value })} />
            ) : (
              <textarea className="min-h-40 rounded-2xl border border-border bg-background p-4 font-mono text-xs outline-none focus:border-primary" placeholder={'1\n00:00:01,000 --> 00:00:03,000\nMerhaba dünya'} value={f.subtitleText} onChange={(e) => setF({ ...f, subtitleText: e.target.value })} />
            )}
            <p className="text-xs text-muted-foreground">Altyazılar sunucu üzerinden otomatik olarak WebVTT formatına dönüştürülür; CORS sorunu yaşanmaz.</p>
          </div>
          <button type="submit" disabled={pending} className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Bölümü ekle
          </button>
          <p className="text-xs text-muted-foreground">Aynı numarada bir bölüm varsa güncellenir.</p>
        </form>
      </Card>

      <Card title="Eklenen" accent="videolar">
        {catalog.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Henüz video yok.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {catalog.map((c) => (
              <li key={c.animeId} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cover || '/placeholder.svg'} alt="" className="h-14 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.count} bölüm</p>
                  </div>
                  <Link href={`/anime/${c.animeId}`} target="_blank" className="grid size-9 place-items-center rounded-full border border-border hover:border-primary" aria-label="Anime sayfasını aç">
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
                <ul className="flex flex-col divide-y divide-border">
                  {c.episodes.map((ep) => (
                    <li key={ep.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-12 font-mono text-xs text-ink">#{ep.number}</span>
                      <span className="min-w-0 flex-1 truncate">{ep.title || `${ep.number}. bölüm`}</span>
                      <span className="hidden font-mono text-[10px] uppercase text-muted-foreground sm:inline">{ep.subtitleUrl || ep.subtitleText ? `${ep.subtitleLang} altyazı` : 'altyazısız'}</span>
                      <Link href={`/anime/${c.animeId}/izle/${ep.number}`} target="_blank" className="text-xs text-ink hover:underline">
                        İzle
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`${ep.number}. bölüm silinsin mi?`)) return
                          start(async () => {
                            await deleteEpisodeAction(c.animeId, ep.id)
                            toast.success('Bölüm silindi')
                            router.refresh()
                          })
                        }}
                        aria-label={`${ep.number}. bölümü sil`}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
