import { SKILLS, TIMELINE } from './data'
import { Burst } from './doodles'

export function Approach() {
  return (
    <section aria-labelledby="fo-skills" className="relative">
      <div className="mx-auto grid w-full max-w-[1320px] gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-12 lg:py-32">
        <div className="flex flex-col gap-10">
          <h2 id="fo-skills" className="font-anton relative w-fit text-[clamp(3.5rem,8vw,6rem)] uppercase leading-[0.85] text-[var(--fo-ink)]">
            Neler <span className="text-[var(--fo-hot)]">yaparım</span>
            <Burst className="absolute -right-10 -top-6 w-12 rotate-12 text-[var(--fo-ink)]" />
          </h2>
          <div className="grid gap-10 sm:grid-cols-3">
            {SKILLS.map((g, i) => (
              <div key={g.group} className="flex flex-col gap-4">
                <p className="font-hand text-3xl text-[var(--fo-hot)]" style={{ rotate: `${i % 2 ? 2 : -3}deg` }}>
                  {g.group}
                </p>
                <ul className="flex flex-col gap-2">
                  {g.items.map((it) => (
                    <li key={it} className="font-anton text-xl uppercase tracking-wide text-[var(--fo-ink)]/90">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <p className="font-hand -rotate-2 text-4xl text-[var(--fo-ink)]">şimdiye kadar…</p>
          <ol className="flex flex-col">
            {TIMELINE.map((t) => (
              <li key={t.title} className="grid gap-2 border-t border-dashed border-[var(--fo-ink)]/20 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--fo-ink)]/55">{t.years}</span>
                <span className="flex flex-col gap-1.5">
                  <span className="font-anton text-2xl uppercase tracking-wide text-[var(--fo-ink)]">{t.title}</span>
                  <span className="text-pretty leading-relaxed text-[var(--fo-ink)]/70">{t.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
