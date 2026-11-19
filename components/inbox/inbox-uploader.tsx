'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Film, FolderPlus, ImagePlus, Link2, Loader2, Pencil, Pin, Trash2, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InboxItem } from '@/lib/inbox'
import { InboxCard, formatSize } from './inbox-card'
import { InboxLightbox } from './inbox-lightbox'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/x-m4v'
const MAX_IMAGE = 15 * 1024 * 1024
const MAX_VIDEO = 80 * 1024 * 1024
const PRESETS = ['Genel', 'Film modu', 'Anime modu', 'Arayüz', 'Logo', 'Maskot', 'Renk & doku']

type Tab = 'dosya' | 'pinterest'
type KindFilter = 'all' | 'image' | 'video'

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Liste alınamadı.')
  return (await res.json()) as { items: InboxItem[] }
}

export function InboxUploader() {
  const { data, mutate, isLoading } = useSWR('/api/kutu', fetcher)
  const [tab, setTab] = useState<Tab>('dosya')
  const [picked, setPicked] = useState<{ file: File; url: string; video: boolean }[]>([])
  const [links, setLinks] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('Genel')
  const [extraCats, setExtraCats] = useState<string[]>([])
  const [newCat, setNewCat] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<string>('Hepsi')
  const [kind, setKind] = useState<KindFilter>('all')
  const [open, setOpen] = useState<number | null>(null)
  const noteId = useId()
  const linksId = useId()
  const newCatId = useId()

  const latest = useRef(picked)
  latest.current = picked
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const items = useMemo(() => data?.items ?? [], [data])
  const categories = useMemo(() => Array.from(new Set([...PRESETS, ...extraCats, ...items.map((i) => i.category)])), [items, extraCats])
  const counts = useMemo(() => items.reduce<Record<string, number>>((acc, i) => ((acc[i.category] = (acc[i.category] ?? 0) + 1), acc), {}), [items])
  const visible = useMemo(() => items.filter((i) => (filter === 'Hepsi' || i.category === filter) && (kind === 'all' || i.kind === kind)), [items, filter, kind])

  function drop(predicate: (index: number) => boolean) {
    setPicked((prev) => {
      prev.forEach((p, i) => predicate(i) && URL.revokeObjectURL(p.url))
      return prev.filter((_, i) => !predicate(i))
    })
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = Array.from(list).filter((f) => ACCEPT.split(',').includes(f.type))
    const tooBig = next.filter((f) => f.size > (f.type.startsWith('video/') ? MAX_VIDEO : MAX_IMAGE))
    const ok = next.filter((f) => !tooBig.includes(f))
    setPicked((prev) => [...prev, ...ok.map((file) => ({ file, url: URL.createObjectURL(file), video: file.type.startsWith('video/') }))])
    const skipped = list.length - next.length
    setMessage(
      tooBig.length || skipped
        ? { tone: 'error', text: [tooBig.length && `${tooBig.length} dosya boyut sınırını aştı (foto 15 MB, video 80 MB).`, skipped && `${skipped} dosya desteklenmeyen türde.`].filter(Boolean).join(' ') }
        : null,
    )
  }

  function addCategory() {
    const name = newCat.replace(/\s+/g, ' ').trim().slice(0, 32)
    if (!name) return
    setExtraCats((c) => (c.includes(name) ? c : [...c, name]))
    setCategory(name)
    setNewCat('')
  }

  async function upload() {
    if (!picked.length || busy) return
    setBusy(true)
    setMessage(null)
    const form = new FormData()
    picked.forEach((p) => form.append('files', p.file))
    form.append('note', note)
    form.append('category', category)
    try {
      const res = await fetch('/api/kutu', { method: 'POST', body: form })
      const json = (await res.json()) as { saved?: InboxItem[]; errors?: string[]; error?: string }
      if (!res.ok && !json.saved?.length) throw new Error(json.error || json.errors?.[0] || 'Yükleme başarısız.')
      drop(() => true)
      setNote('')
      setMessage({ tone: json.errors?.length ? 'error' : 'ok', text: json.errors?.length ? json.errors.join(' ') : `${json.saved?.length ?? 0} öğe “${category}” kategorisine bırakıldı.` })
      await mutate()
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Yükleme başarısız.' })
    } finally {
      setBusy(false)
    }
  }

  async function addLinks() {
    const list = links
      .split(/[\s,]+/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (!list.length || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/kutu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ links: list, note, category }) })
      const json = (await res.json()) as { saved?: InboxItem[]; errors?: string[]; error?: string }
      if (!res.ok && !json.saved?.length) throw new Error(json.error || json.errors?.join(' ') || 'Bağlantı eklenemedi.')
      const videos = json.saved?.filter((s) => s.kind === 'video').length ?? 0
      const photos = (json.saved?.length ?? 0) - videos
      setLinks('')
      setNote('')
      setMessage({
        tone: json.errors?.length ? 'error' : 'ok',
        text: [`${[photos && `${photos} fotoğraf`, videos && `${videos} video`].filter(Boolean).join(' ve ')} Pinterest'ten eklendi.`, ...(json.errors ?? [])].join(' '),
      })
      await mutate()
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Bağlantı eklenemedi.' })
    } finally {
      setBusy(false)
    }
  }

  async function move(name: string, to: string) {
    await mutate(async (cur) => {
      await fetch(`/api/kutu/${name}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: to }) })
      return { items: (cur?.items ?? []).map((i) => (i.name === name ? { ...i, category: to } : i)) }
    }, { optimisticData: (cur) => ({ items: (cur?.items ?? []).map((i) => (i.name === name ? { ...i, category: to } : i)) }), revalidate: false })
  }

  async function remove(name: string) {
    await mutate(async (cur) => {
      await fetch(`/api/kutu/${name}`, { method: 'DELETE' })
      return { items: (cur?.items ?? []).filter((i) => i.name !== name) }
    }, { optimisticData: (cur) => ({ items: (cur?.items ?? []).filter((i) => i.name !== name) }), revalidate: true })
  }

  async function renameFilter() {
    if (filter === 'Hepsi') return
    const to = window.prompt(`“${filter}” kategorisinin yeni adı:`, filter)?.trim()
    if (!to || to === filter) return
    await fetch('/api/kutu', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: filter, to }) })
    setExtraCats((c) => c.map((x) => (x === filter ? to : x)))
    setFilter(to)
    await mutate()
  }

  async function clearFiltered() {
    const scope = filter === 'Hepsi' ? 'Kutudaki tüm öğeler' : `“${filter}” kategorisindeki tüm öğeler`
    if (!window.confirm(`${scope} silinsin mi?`)) return
    await fetch(filter === 'Hepsi' ? '/api/kutu' : `/api/kutu?kategori=${encodeURIComponent(filter)}`, { method: 'DELETE' })
    setFilter('Hepsi')
    await mutate()
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-4 sm:p-6" aria-label="Kutuya ekle">
        <div className="flex rounded-full bg-muted p-1" role="tablist" aria-label="Ekleme yöntemi">
          {(
            [
              { id: 'dosya', label: 'Foto / video yükle', icon: UploadCloud },
              { id: 'pinterest', label: 'Pinterest bağlantısı', icon: Pin },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn('flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium transition', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <t.icon className="size-4" aria-hidden="true" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">
            Kategori <span className="font-normal text-muted-foreground">— eklenenler buraya girer</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn('rounded-full border px-3.5 py-1.5 text-sm transition', category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground/40')}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <label htmlFor={newCatId} className="sr-only">
              Yeni kategori adı
            </label>
            <input
              id={newCatId}
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  addCategory()
                }
              }}
              maxLength={32}
              placeholder="Yeni kategori (örn. Afiş fikirleri)"
              className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
            <button type="button" onClick={addCategory} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium transition hover:border-foreground/40">
              <FolderPlus className="size-4" aria-hidden="true" /> Ekle
            </button>
          </div>
        </fieldset>

        {tab === 'dosya' ? (
          <div className="flex flex-col gap-5">
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                addFiles(e.dataTransfer.files)
              }}
              className={cn(
                'group relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition',
                dragging ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/60',
              )}
            >
              <input type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => (addFiles(e.target.files), (e.target.value = ''))} />
              <span className="flex gap-2">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground transition group-hover:-rotate-6">
                  <ImagePlus className="size-5" aria-hidden="true" />
                </span>
                <span className="grid size-12 place-items-center rounded-2xl bg-foreground text-background transition group-hover:rotate-6">
                  <Film className="size-5" aria-hidden="true" />
                </span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-lg font-semibold">Fotoğraf ya da video seç, sürükleyip bırak</span>
                <span className="text-sm text-muted-foreground">PNG, JPG, WEBP, GIF, AVIF (15 MB) · MP4, WEBM, MOV (80 MB)</span>
              </span>
            </label>

            {picked.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                {picked.map((p, i) => (
                  <li key={p.url} className="relative">
                    {p.video ? (
                      <video src={p.url} muted playsInline preload="metadata" className="aspect-square w-full rounded-xl object-cover ring-1 ring-border" aria-label={p.file.name} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url || '/placeholder.svg'} alt={p.file.name} className="aspect-square w-full rounded-xl object-cover ring-1 ring-border" />
                    )}
                    {p.video && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-scrim/80 px-1.5 py-0.5 font-mono text-[9px] uppercase text-on-scrim">Video</span>
                    )}
                    <button
                      type="button"
                      onClick={() => drop((j) => j === i)}
                      aria-label={`${p.file.name} dosyasını çıkar`}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-scrim/80 text-on-scrim backdrop-blur transition hover:bg-scrim"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor={linksId} className="text-sm font-medium">
              Pinterest bağlantıları <span className="font-normal text-muted-foreground">(her satıra bir tane, en fazla 10)</span>
            </label>
            <textarea
              id={linksId}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={3}
              placeholder={'https://pin.it/…\nhttps://tr.pinterest.com/pin/123456789/'}
              className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="size-3.5" aria-hidden="true" /> Pin videoysa video olarak, fotoğrafsa en yüksek çözünürlükte fotoğraf olarak eklenir.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor={noteId} className="text-sm font-medium">
            Not <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={600}
            rows={2}
            placeholder="Örn: Bu kartların köşe yuvarlaklığını ve gölgesini film sayfasına uygula."
            className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {tab === 'dosya' ? `${picked.length} dosya · ${formatSize(picked.reduce((s, p) => s + p.file.size, 0))}` : `${links.split(/[\s,]+/).filter(Boolean).length} bağlantı`} → {category}
          </span>
          <div className="flex items-center gap-2">
            {tab === 'dosya' && picked.length > 0 && (
              <button type="button" onClick={() => drop(() => true)} className="h-11 rounded-full border border-border px-5 text-sm font-medium transition hover:border-foreground/40">
                Temizle
              </button>
            )}
            <button
              type="button"
              onClick={tab === 'dosya' ? upload : addLinks}
              disabled={busy || (tab === 'dosya' ? !picked.length : !links.trim())}
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : tab === 'dosya' ? <UploadCloud className="size-4" /> : <Pin className="size-4" />}
              {tab === 'dosya' ? 'Kutuya bırak' : busy ? 'Pin çözülüyor…' : 'Pinleri ekle'}
            </button>
          </div>
        </div>

        <p role="status" aria-live="polite" className={cn('min-h-5 text-sm', message?.tone === 'error' ? 'text-destructive' : 'text-ink')}>
          {message?.text}
        </p>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="inbox-list">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="inbox-list" className="text-2xl font-semibold tracking-tight">
            Kutudakiler <span className="font-mono text-sm font-normal text-muted-foreground">({items.length})</span>
          </h2>
          <div className="flex items-center gap-1 rounded-full bg-muted p-1" role="group" aria-label="Türe göre süz">
            {(
              [
                { id: 'all', label: 'Hepsi' },
                { id: 'image', label: 'Foto' },
                { id: 'video', label: 'Video' },
              ] as const
            ).map((k) => (
              <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition', kind === k.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Kategoriler">
            {['Hepsi', ...categories.filter((c) => counts[c])].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
                className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition', filter === c ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}
              >
                {c}
                <span className={cn('font-mono text-[10px]', filter === c ? 'text-background/70' : 'text-muted-foreground')}>{c === 'Hepsi' ? items.length : counts[c]}</span>
              </button>
            ))}
          </nav>
          {items.length > 0 && (
            <div className="flex shrink-0 items-center gap-4">
              {filter !== 'Hepsi' && (
                <button type="button" onClick={renameFilter} className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
                  <Pencil className="size-4" aria-hidden="true" /> Yeniden adlandır
                </button>
              )}
              <button type="button" onClick={clearFiltered} className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-destructive">
                <Trash2 className="size-4" aria-hidden="true" /> {filter === 'Hepsi' ? 'Hepsini sil' : 'Kategoriyi boşalt'}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            {items.length ? 'Bu süzgeçte öğe yok.' : 'Kutu boş. Yüklediğin fotoğraf, video ve pinler burada görünür.'}
          </p>
        ) : (
          <ul className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {visible.map((item, i) => (
              <InboxCard key={item.name} item={item} categories={categories} onMove={(c) => move(item.name, c)} onRemove={() => remove(item.name)} onOpen={() => setOpen(i)} />
            ))}
          </ul>
        )}
      </section>

      <InboxLightbox items={visible} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  )
}
