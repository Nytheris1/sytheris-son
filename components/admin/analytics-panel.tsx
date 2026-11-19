import { cn } from '@/lib/utils'

export type AnalyticsInput = {
  signups: number[]
  comments: number[]
  active7: number
  active30: number
  total: number
  verified: number
  banned: number
  tiers: { label: string; value: number }[]
  providers: { label: string; value: number }[]
  topAnime: { title: string; value: number }[]
  topUsers: { name: string; value: number }[]
}

const DAY = 86_400_000

/** Buckets timestamps into the last `days` calendar days (oldest first) in Turkey time. */
export function dailyBuckets(stamps: number[], days = 14) {
  const tz = 3 * 3_600_000
  const today = Math.floor((Date.now() + tz) / DAY)
  const out = new Array<number>(days).fill(0)
  for (const t of stamps) {
    const idx = days - 1 - (today - Math.floor((t + tz) / DAY))
    if (idx >= 0 && idx < days) out[idx]++
  }
  return out
}

function dayLabel(offsetFromToday: number) {
  return new Date(Date.now() - offsetFromToday * DAY).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
}

function Bars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values)
  const sum = values.reduce((a, b) => a + b, 0)
  return (
    <figure className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">Son 14 gün · {sum}</span>
      </figcaption>
      <div className="flex h-36 items-end gap-1" role="img" aria-label={`${label}: son 14 günde toplam ${sum}`}>
        {values.map((v, i) => (
          <div key={i} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 text-[10px] tabular-nums text-background opacity-0 transition group-hover:opacity-100">
              {v}
            </span>
            <span className={cn('w-full rounded-t-md transition-colors', v ? 'bg-primary group-hover:brightness-110' : 'bg-muted')} style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{dayLabel(values.length - 1)}</span>
        <span>Bugün</span>
      </div>
    </figure>
  )
}

function Breakdown({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.label} className="flex flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.value} · {Math.round((r.value / total) * 100)}%
                </span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.value / total) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function AnalyticsPanel({ data }: { data: AnalyticsInput }) {
  const pct = (n: number) => (data.total ? Math.round((n / data.total) * 100) : 0)
  const kpis = [
    { label: 'Aktif (7 gün)', value: data.active7, hint: `Üyelerin %${pct(data.active7)}'i` },
    { label: 'Aktif (30 gün)', value: data.active30, hint: `Üyelerin %${pct(data.active30)}'i` },
    { label: 'Doğrulanmış e-posta', value: data.verified, hint: `%${pct(data.verified)}` },
    { label: 'Askıdaki hesap', value: data.banned, hint: data.banned ? 'Kullanıcılar sekmesinden yönet' : 'Yok' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bars values={data.signups} label="Yeni kayıtlar" />
        <Bars values={data.comments} label="Yorumlar" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Breakdown title="Üyelik planları" rows={data.tiers} empty="Henüz üye yok." />
        <Breakdown title="Giriş yöntemleri" rows={data.providers} empty="Henüz üye yok." />
        <Breakdown title="En çok konuşulan animeler" rows={data.topAnime.map((a) => ({ label: a.title, value: a.value }))} empty="Henüz yorum yok." />
        <Breakdown title="En aktif yorumcular" rows={data.topUsers.map((u) => ({ label: u.name, value: u.value }))} empty="Henüz yorum yok." />
      </div>
    </div>
  )
}
