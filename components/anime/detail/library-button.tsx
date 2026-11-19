'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BookmarkPlus, Check, ChevronDown, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { setAnimeStatus, toggleInList } from '@/app/actions/library'
import { STATUS_LABEL, type ListStatus } from '@/lib/library-types'
import { cn } from '@/lib/utils'
import { Popover } from '@/components/ui-kit/popover'

type CustomList = { id: string; name: string; hue: number; has: boolean }

export function LibraryButton({ animeId, loggedIn, initialStatus, customLists }: { animeId: number; loggedIn: boolean; initialStatus: ListStatus | null; customLists: CustomList[] }) {
  const [status, setStatus] = useState<ListStatus | null>(initialStatus)
  const [lists, setLists] = useState(customLists)
  const [pending, start] = useTransition()
  const router = useRouter()

  if (!loggedIn) {
    return (
      <button
        type="button"
        onClick={() => toast('Kütüphanene eklemek için giriş yap', { action: { label: 'Giriş yap', onClick: () => router.push('/giris') } })}
        className="flex h-13 items-center gap-2 rounded-full border border-foreground/25 px-5 font-medium backdrop-blur transition hover:bg-foreground/10"
      >
        <BookmarkPlus className="size-4" />
        Listeye ekle
      </button>
    )
  }

  const pick = (s: ListStatus | null) => {
    const prev = status
    setStatus(s)
    start(async () => {
      const res = await setAnimeStatus(animeId, s)
      if (!res.ok) {
        setStatus(prev)
        toast.error(res.error)
      } else toast.success(s ? `“${STATUS_LABEL[s]}” listesine eklendi` : 'Kütüphaneden çıkarıldı')
    })
  }

  const toggle = (id: string) => {
    setLists((ls) => ls.map((l) => (l.id === id ? { ...l, has: !l.has } : l)))
    start(async () => {
      const res = await toggleInList(id, animeId)
      if (!res.ok) {
        setLists((ls) => ls.map((l) => (l.id === id ? { ...l, has: !l.has } : l)))
        toast.error(res.error)
      }
    })
  }

  return (
    <Popover
      label="Kütüphane"
      align="start"
      className="w-72 p-2"
      trigger={({ open, toggle: t, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={t}
          aria-expanded={open}
          className={cn(
            'flex h-13 items-center gap-2 rounded-full border px-5 font-medium backdrop-blur transition',
            status ? 'border-primary bg-primary/15 text-primary' : 'border-foreground/25 hover:bg-foreground/10',
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : status ? <Check className="size-4" /> : <BookmarkPlus className="size-4" />}
          {status ? STATUS_LABEL[status] : 'Listeye ekle'}
          <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-1">
          <p className="label-mono px-3 pb-1 pt-2 text-[9px] text-muted-foreground">Durum</p>
          {(Object.keys(STATUS_LABEL) as ListStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                pick(status === s ? null : s)
                close()
              }}
              className={cn('flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted', status === s && 'bg-accent font-medium')}
            >
              {STATUS_LABEL[s]}
              {status === s && <Check className="size-4 text-ink" />}
            </button>
          ))}
          <div className="my-1 h-px bg-border" />
          <p className="label-mono px-3 pb-1 pt-1 text-[9px] text-muted-foreground">Koleksiyonlarım</p>
          {lists.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Henüz özel listen yok.</p>}
          {lists.map((l) => (
            <button key={l.id} type="button" onClick={() => toggle(l.id)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted">
              <span className="size-3 rounded-full" style={{ background: `oklch(0.72 0.16 ${l.hue})` }} />
              <span className="flex-1 truncate">{l.name}</span>
              <span className={cn('grid size-5 place-items-center rounded-md border transition', l.has ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                {l.has && <Check className="size-3" />}
              </span>
            </button>
          ))}
          <Link href="/kutuphane?yeni=1" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-muted">
            <Plus className="size-4" /> Yeni liste oluştur
          </Link>
        </div>
      )}
    </Popover>
  )
}
