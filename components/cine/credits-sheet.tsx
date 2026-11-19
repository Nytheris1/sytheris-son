/** "Künye" — the production facts set like a film's closing crawl: role on the left, name on the right of a centre line. */
export function CreditsSheet({ rows, footnote }: { rows: { role: string; value: React.ReactNode }[]; footnote?: string | null }) {
  if (!rows.length) return null
  return (
    <div className="dark cine-perf relative overflow-hidden rounded-2xl bg-scrim px-6 py-16 text-foreground ring-1 ring-border sm:px-10">
      <div className="grain absolute inset-0" aria-hidden="true" />
      <dl className="relative mx-auto flex max-w-2xl flex-col gap-4">
        {rows.map((r) => (
          <div key={r.role} className="grid grid-cols-2 items-baseline gap-6">
            <dt className="text-right font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50">{r.role}</dt>
            <dd className="text-pretty text-base font-semibold leading-snug sm:text-lg">{r.value}</dd>
          </div>
        ))}
      </dl>
      {footnote && <p className="relative mx-auto mt-10 max-w-xl text-pretty text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-foreground/40">{footnote}</p>}
    </div>
  )
}
