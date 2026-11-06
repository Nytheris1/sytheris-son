'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ExternalLink, Eye, Loader2, Plus, Trash2, Wand2, Tv } from 'lucide-react'
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
  const [searchingTorrent, setSearchingTorrent] = useState(false)
  const [searchingStream, setSearchingStream] = useState(false)
  
  const [f, setF] = useState({ number: 1, title: '', videoUrl: '', magnetUrl: '', thumbnail: '', subtitleUrl: '', subtitleText: '', subtitleLang: 'tr' })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!anime) return toast.error('Önce bir anime seç')
    start(async () => {
      const res = await addEpisodeAction({
        animeId: anime.id,
        animeTitle: anime.title,
        animeCover: anime.cover,
        number: Number(f.number),
        title: f.title,
        videoUrl: f.videoUrl.trim(),
        magnetUrl: f.magnetUrl.trim(),
        thumbnail: f.thumbnail.trim(),
        subtitleUrl: subMode === 'url' ? f.subtitleUrl.trim() : '',
        subtitleText: subMode === 'text' ? f.subtitleText : '',
        subtitleLang: f.subtitleLang,
      })
      if (!res.ok) return toast.error(res.error)
      toast.success(`${anime.title} · ${f.number}. bölüm eklendi`)
      setF((x) => ({ ...x, number: x.number + 1, title: '', videoUrl: '', magnetUrl: '', thumbnail: '', subtitleUrl: '', subtitleText: '' }))
      router.refresh()
    })
  }

  const handleFindStream = async () => {
    if (!anime || !f.number) return toast.error('Anime ve bölüm numarası gerekli')
    setSearchingStream(true)
    toast.loading('HLS/MP4 Akış linki aranıyor...', { id: 'stream' })
    
    try {
      const res = await fetch(`/api/stream?title=${encodeURIComponent(anime.title)}&ep=${f.number}`)
      
      // Güvenli okuma: Eğer sunucu JSON yerine HTML hata sayfası dönerse çökmeyi engeller
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Sunucu geçersiz yanıt döndürdü (HTML veya boş sayfa). Vercel loglarına bakın.')
      }
      
      if (data.streamUrl) {
        setF((prev) => ({ ...prev, videoUrl: data.streamUrl }))
        toast.success('Akış linki bulundu ve eklendi!', { id: 'stream' })
      } else {
        toast.error(data.error || 'Bulunamadı', { id: 'stream', duration: 6000 })
        console.log('Detaylı Hata:', data)
      }
    } catch (error: any) {
      toast.error(error.message || 'Bağlantı hatası', { id: 'stream', duration: 8000 })
      console.error(error)
    } finally {
      setSearchingStream(false)
    }
  }

  const handleFindTorrent = async () => {
    if (!anime || !f.number) return toast.error('Anime ve bölüm numarası gerekli')
    setSearchingTorrent(true)
    toast.loading('Torrent aranıyor...', { id: 'torrent' })
    
    try {
      const q = `${anime.title} ${f.number < 10 ? '0'+f.number : f.number}`
      const res = await fetch(`/api/torrents?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      
      if (data.magnet) {
        setF((prev) => ({ 
          ...prev, 
          magnetUrl: data.magnet,
          title: prev.title || data.title || `${prev.number}. bölüm`,
          thumbnail: prev.thumbnail || anime.cover || ''
        }))
        toast.success(`Torrent bulundu! (${data.seeders} seed)`, { id: 'torrent' })
      } else {
        toast.error(data.error || 'Bulunamadı', { id: 'torrent' })
      }
    } catch {
      toast.error('Arama hatası', { id: 'torrent' })
    } finally {
      setSearchingTorrent(false)
    }
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
              <span className="text-muted-foreground">Bölüm başlığı</span>
              <input className={field} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* MP4 / HLS */}
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">HLS / MP4 Linki</span>
                <button 
                  type="button" 
                  onClick={handleFindStream}
                  disabled={searchingStream}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                >
                  {searchingStream ? <Loader2 className="size-3.5 animate-spin" /> : <Tv className="size-3.5" />}
                  Akış Bul
                </button>
              </div>
              <input type="text" className={field} placeholder="https://.../master.m3u8" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
            </div>

            {/* Magnet */}
            <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Magnet Linki</span>
                <button 
                  type="button" 
                  onClick={handleFindTorrent}
                  disabled={searchingTorrent}
                  className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold transition hover:brightness-110 disabled:opacity-50"
                >
                  {searchingTorrent ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                  Torrent Bul
                </button>
              </div>
              <input type="text" className={field} placeholder="magnet:?xt=urn:btih:..." value={f.magnetUrl} onChange={(e) => setF({ ...f, magnetUrl: e.target.value })} />
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Küçük resim (opsiyonel)</span>
            <input type="url" className={field} placeholder="https://…/kapak.jpg" value={f.thumbnail} onChange={(e) => setF({ ...f, thumbnail: e.target.value })} />
          </label>

          <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">Altyazı (SRT, VTT)</span>
              <div className="flex items-center gap-2">
                <select value={f.subtitleLang} onChange={(e) => setF({ ...f, subtitleLang: e.target.value })} className="h-9 rounded-xl border border-border bg-background px-2 text-sm">
                  <option value="tr">Türkçe</option>
                  <option value="en">İngilizce</option>
                  <option value="ja">Japonca</option>
                </select>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {(['url', 'text'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setSubMode(m)} className={cn('rounded-lg px-3 py-1 text-xs transition', subMode === m ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                      {m === 'url' ? 'Bağlantı' : 'Metin'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {subMode === 'url' ? (
              <input type="url" className={field} placeholder="https://…/bolum-1.tr.srt" value={f.subtitleUrl} onChange={(e) => setF({ ...f, subtitleUrl: e.target.value })} />
            ) : (
              <textarea className="min-h-40 rounded-2xl border border-border bg-background p-4 font-mono text-xs outline-none focus:border-primary" value={f.subtitleText} onChange={(e) => setF({ ...f, subtitleText: e.target.value })} />
            )}
          </div>

          <button type="submit" disabled={pending} className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-foreground font-semibold text-background transition hover:opacity-90 disabled:opacity-70">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Bölümü ekle
          </button>
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
                  </div>
                  <Link href={`/anime/${c.animeId}`} target="_blank" className="grid size-9 place-items-center rounded-full border border-border hover:border-primary">
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
                <ul className="flex flex-col divide-y divide-border">
                  {c.episodes.map((ep) => (
                    <li key={ep.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-12 font-mono text-xs text-ink">#{ep.number}</span>
                      <span className="min-w-0 flex-1 truncate">{ep.title || `${ep.number}. bölüm`}</span>
                      <span className="hidden font-mono text-[10px] uppercase text-muted-foreground sm:inline">
                        {ep.videoUrl ? 'HLS/MP4' : (ep.magnetUrl ? 'Torrent' : 'Yok')}
                      </span>
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