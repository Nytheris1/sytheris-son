'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Check, ExternalLink, Flag, Loader2, MessageSquare, RotateCcw, Trash2, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { moderateComment, resolveReport, setUserBanned } from '@/app/sy-core/actions'
import { cn } from '@/lib/utils'

export type ReportRow = {
  id: string
  kind: 'comment' | 'user'
  targetId: string
  animeId?: number
  reason: string
  at: number
  status: 'open' | 'resolved' | 'dismissed'
  snapshot: string
  reporter: string
  target?: { username: string; displayName: string } | null
}

export function ReportsPanel({ reports }: { reports: ReportRow[] }) {
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [busy, setBusy] = useState<string | null>(null)
  const [, start] = useTransition()
  const router = useRouter()
  const list = reports.filter((r) => filter === 'all' || r.status === 'open')

  const run = (id: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(id)
    start(async () => {
      try {
        await fn()
        toast.success(msg)
        router.refresh()
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setBusy(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label="Filtre">
          {(
            [
              ['open', `Açık (${reports.filter((r) => r.status === 'open').length})`],
              ['all', `Tümü (${reports.length})`],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={filter === v} onClick={() => setFilter(v)} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition', filter === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
          <Check className="size-8 text-ink" />
          <p className="font-semibold">Kuyruk temiz</p>
          <p className="text-sm text-muted-foreground">İncelenecek bildirim yok.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((r) => (
            <li key={r.id} className={cn('flex flex-col gap-3 rounded-3xl border bg-card p-5', r.status === 'open' ? 'border-destructive/30' : 'border-border opacity-70')}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                  <Flag className="size-3" /> {r.reason}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  {r.kind === 'comment' ? <MessageSquare className="size-3" /> : <UserRound className="size-3" />}
                  {r.kind === 'comment' ? 'Yorum' : 'Profil'}
                </span>
                <span className="text-muted-foreground">
                  {r.reporter} tarafından · {new Date(r.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {r.status !== 'open' && <span className="ml-auto rounded-full bg-muted px-2.5 py-1 font-mono uppercase">{r.status === 'resolved' ? 'Çözüldü' : 'Reddedildi'}</span>}
              </div>
              <blockquote className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">{r.snapshot}</blockquote>
              <div className="flex flex-wrap items-center gap-2">
                {r.kind === 'comment' && r.animeId && (
                  <Link href={`/anime/${r.animeId}#yorumlar`} target="_blank" className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition hover:border-primary">
                    <ExternalLink className="size-3.5" /> Bağlamı gör
                  </Link>
                )}
                {r.kind === 'user' && r.target && (
                  <Link href={`/u/${r.target.username}`} target="_blank" className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition hover:border-primary">
                    <ExternalLink className="size-3.5" /> @{r.target.username}
                  </Link>
                )}
                {r.status === 'open' ? (
                  <>
                    {r.kind === 'comment' && r.animeId && (
                      <button type="button" onClick={() => run(r.id, () => moderateComment(r.animeId!, r.targetId, r.id), 'Yorum kaldırıldı')} className="flex h-9 items-center gap-1.5 rounded-full bg-destructive px-3 text-xs font-medium text-on-scrim transition hover:brightness-110">
                        <Trash2 className="size-3.5" /> Yorumu sil
                      </button>
                    )}
                    {r.kind === 'user' && (
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            r.id,
                            async () => {
                              await setUserBanned(r.targetId, true, r.reason)
                              await resolveReport(r.id, 'resolved')
                            },
                            'Kullanıcı askıya alındı',
                          )
                        }
                        className="flex h-9 items-center gap-1.5 rounded-full bg-destructive px-3 text-xs font-medium text-on-scrim transition hover:brightness-110"
                      >
                        <UserRound className="size-3.5" /> Askıya al
                      </button>
                    )}
                    <button type="button" onClick={() => run(r.id, () => resolveReport(r.id, 'resolved'), 'Çözüldü olarak işaretlendi')} className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition hover:border-primary">
                      <Check className="size-3.5" /> Çözüldü
                    </button>
                    <button type="button" onClick={() => run(r.id, () => resolveReport(r.id, 'dismissed'), 'Bildirim reddedildi')} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground transition hover:bg-muted">
                      <X className="size-3.5" /> Reddet
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => run(r.id, () => resolveReport(r.id, 'open'), 'Yeniden açıldı')} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground transition hover:bg-muted">
                    <RotateCcw className="size-3.5" /> Yeniden aç
                  </button>
                )}
                {busy === r.id && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
