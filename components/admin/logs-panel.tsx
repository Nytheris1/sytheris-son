'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { clearLogsAction } from '@/app/admin/actions'
import type { LogEntry } from '@/lib/site'
import { cn } from '@/lib/utils'

export function LogsPanel({ logs }: { logs: LogEntry[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all')
  const [pending, start] = useTransition()
  const list = logs.filter((l) => filter === 'all' || l.level === filter)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'error', 'warn'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn('rounded-full border px-4 py-2 text-sm transition', filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
            {f === 'all' ? `Tümü (${logs.length})` : f === 'error' ? `Hatalar (${logs.filter((l) => l.level === 'error').length})` : `Uyarılar (${logs.filter((l) => l.level === 'warn').length})`}
          </button>
        ))}
        <button
          type="button"
          disabled={pending || logs.length === 0}
          onClick={() =>
            start(async () => {
              await clearLogsAction()
              toast.success('Kayıtlar temizlendi')
              router.refresh()
            })
          }
          className="ml-auto flex h-10 items-center gap-2 rounded-full px-4 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Temizle
        </button>
      </div>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Kayıt yok. Sistem sorunsuz çalışıyor.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((l) => (
            <li key={l.id}>
              <details className="group rounded-2xl border border-border bg-card p-4 open:border-primary/40">
                <summary className="flex cursor-pointer list-none items-start gap-3">
                  <span className={cn('mt-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase', l.level === 'error' ? 'bg-destructive text-on-scrim' : 'bg-accent text-ink')}>{l.level}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{l.message}</span>
                    <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                      {new Date(l.at).toLocaleString('tr-TR')} · {l.source} {l.path ? `· ${l.path}` : ''}
                    </span>
                  </span>
                </summary>
                {(l.stack || l.userAgent) && (
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {l.stack}
                    {l.userAgent ? `\n\nUA: ${l.userAgent}` : ''}
                  </pre>
                )}
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
