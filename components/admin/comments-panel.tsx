'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ExternalLink, Loader2, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { moderateComment } from '@/app/sy-core/actions'

export type CommentRow = { id: string; animeId: number; animeTitle: string; text: string; spoiler: boolean; at: number; likes: number; author: string }

export function CommentsPanel({ comments }: { comments: CommentRow[] }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [, start] = useTransition()
  const router = useRouter()
  const list = comments.filter((c) => `${c.text} ${c.author} ${c.animeTitle}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Yorumlarda, yazarlarda veya animelerde ara…" aria-label="Yorum ara" className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary" />
      </div>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Henüz yorum yok.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card">
          {list.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{c.author}</span>
                  <span>·</span>
                  <Link href={`/anime/${c.animeId}#yorumlar`} target="_blank" className="inline-flex items-center gap-1 hover:text-ink">
                    {c.animeTitle} <ExternalLink className="size-3" />
                  </Link>
                  <span>· {new Date(c.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {c.spoiler && <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-mono text-[9px] uppercase text-destructive">spoiler</span>}
                  <span>· {c.likes} beğeni</span>
                </p>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed">{c.text}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBusy(c.id)
                  start(async () => {
                    try {
                      await moderateComment(c.animeId, c.id)
                      toast.success('Yorum silindi')
                      router.refresh()
                    } catch (e) {
                      toast.error((e as Error).message)
                    } finally {
                      setBusy(null)
                    }
                  })
                }}
                className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-destructive/10 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/20"
              >
                {busy === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
