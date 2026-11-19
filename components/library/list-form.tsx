'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Globe2, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createList, updateList } from '@/app/actions/library'
import { LIST_HUES, type LibraryList } from '@/lib/library-types'
import { cn } from '@/lib/utils'

export function ListForm({ initial, onDone }: { initial?: LibraryList; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [hue, setHue] = useState(initial?.hue ?? LIST_HUES[0])
  const [isPublic, setPublic] = useState(initial?.isPublic ?? true)
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = initial ? await updateList(initial.id, { name, description, hue, isPublic }) : await createList({ name, description, hue })
          if (!res.ok) {
            toast.error(res.error)
            return
          }
          toast.success(initial ? 'Liste güncellendi' : 'Liste oluşturuldu')
          router.refresh()
          onDone()
        })
      }}
      className="flex flex-col gap-5 p-6"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl text-lg font-bold" style={{ background: `oklch(0.72 0.16 ${hue})`, color: 'oklch(0.18 0.03 0)' }}>
          {name.slice(0, 1).toUpperCase() || 'L'}
        </span>
        <div>
          <p className="text-lg font-semibold">{initial ? 'Listeyi düzenle' : 'Yeni koleksiyon'}</p>
          <p className="text-sm text-muted-foreground">Örn. “Ağlatan animeler”, “Kış maratonu”</p>
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Liste adı</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required data-autofocus className="h-12 rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Açıklama (isteğe bağlı)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={140} rows={2} className="resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary" />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm text-muted-foreground">Renk</legend>
        <div className="flex flex-wrap gap-2">
          {LIST_HUES.map((h) => (
            <button
              key={h}
              type="button"
              aria-label={`Renk ${h}`}
              aria-pressed={hue === h}
              onClick={() => setHue(h)}
              className={cn('size-9 rounded-full ring-offset-2 ring-offset-popover transition hover:scale-110', hue === h && 'ring-2 ring-foreground')}
              style={{ background: `oklch(0.72 0.16 ${h})` }}
            />
          ))}
        </div>
      </fieldset>
      {initial && (
        <button type="button" onClick={() => setPublic((v) => !v)} className="flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm">
          {isPublic ? <Globe2 className="size-4" /> : <Lock className="size-4" />}
          {isPublic ? 'Profilde herkese açık' : 'Sadece ben'}
        </button>
      )}
      <button type="submit" disabled={pending} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {initial ? 'Kaydet' : 'Oluştur'}
      </button>
    </form>
  )
}
