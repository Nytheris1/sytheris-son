'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Copy, KeyRound, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPremiumCodes, deletePremiumCode } from '@/app/sy-core/actions'
import { cn } from '@/lib/utils'

export type CodeRow = { code: string; tier: 'plus' | 'ultra'; days: number; createdAt: number; usedBy?: string | null; usedAt?: number | null; note?: string }

export function CodesPanel({ codes }: { codes: CodeRow[] }) {
  const [tier, setTier] = useState<'plus' | 'ultra'>('plus')
  const [days, setDays] = useState(30)
  const [count, setCount] = useState(5)
  const [note, setNote] = useState('')
  const [fresh, setFresh] = useState<string[]>([])
  const [pending, start] = useTransition()
  const router = useRouter()
  const unused = codes.filter((c) => !c.usedBy).length

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => {
            try {
              const res = await createPremiumCodes(tier, days, count, note)
              setFresh(res.codes)
              toast.success(`${res.codes.length} kod üretildi`)
              router.refresh()
            } catch (err) {
              toast.error((err as Error).message)
            }
          })
        }}
        className="grid gap-4 rounded-3xl border border-border bg-card p-6 md:grid-cols-[auto_auto_auto_1fr_auto] md:items-end"
      >
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-xs text-muted-foreground">Plan</legend>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(['plus', 'ultra'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={tier === t} onClick={() => setTier(t)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition', tier === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Gün
          <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Adet
          <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-10 w-20 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Not
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. Discord çekilişi" className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" />
        </label>
        <button type="submit" disabled={pending} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-70">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Üret
        </button>
      </form>

      {fresh.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-primary/50 bg-accent p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Yeni kodlar</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(fresh.join('\n'))
                toast.success('Kopyalandı')
              }}
              className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium"
            >
              <Copy className="size-3.5" /> Tümünü kopyala
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fresh.map((c) => (
              <code key={c} className="rounded-lg bg-card px-3 py-1.5 font-mono text-sm tracking-wider">
                {c}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Tüm kodlar</p>
        <p className="font-mono text-xs text-muted-foreground">
          {unused} kullanılmamış · {codes.length} toplam
        </p>
      </div>
      {codes.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Henüz kod üretilmedi.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card">
          {codes.map((c) => (
            <li key={c.code} className={cn('flex flex-wrap items-center gap-3 px-5 py-3 text-sm', c.usedBy && 'opacity-55')}>
              <code className="font-mono tracking-wider">{c.code}</code>
              <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] uppercase', c.tier === 'ultra' ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground')}>{c.tier}</span>
              <span className="text-xs text-muted-foreground">{c.days} gün</span>
              {c.note && <span className="text-xs text-muted-foreground">· {c.note}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{c.usedBy ? `Kullanıldı · ${new Date(c.usedAt ?? 0).toLocaleDateString('tr-TR')}` : 'Bekliyor'}</span>
              <button
                type="button"
                aria-label={`${c.code} kodunu kopyala`}
                onClick={() => {
                  navigator.clipboard.writeText(c.code)
                  toast.success('Kopyalandı')
                }}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`${c.code} kodunu sil`}
                onClick={() =>
                  start(async () => {
                    await deletePremiumCode(c.code)
                    router.refresh()
                  })
                }
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
