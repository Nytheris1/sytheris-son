import type { ContentMode } from '@/lib/content-mode-shared'
import { ModeSwitcher } from './mode-switcher'

/** Quiet invitation to the other catalogue, placed mid-page on both home screens. */
export function ModeCrossover({ mode }: { mode: ContentMode }) {
  const film = mode === 'film'
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10" aria-labelledby="mode-cross">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div className="flex max-w-xl flex-col gap-2">
          <p className="label-mono text-ink">{film ? 'Sinema modundasın' : 'Bir de sinema var'}</p>
          <h2 id="mode-cross" className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {film ? (
              <>
                Animeleri mi <span className="accent-serif">özledin?</span>
              </>
            ) : (
              <>
                Bu akşam canlı çekim bir <span className="accent-serif">film?</span>
              </>
            )}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {film ? 'Tek dokunuşla anime kataloğuna geri dön; listelerin, favorilerin olduğu yerde bekliyor.' : 'Sinema moduna geç: ana sayfa Türkiye listelerinden filmler, resmî fragmanlar ve tür seanslarıyla yeniden kurulur.'}
          </p>
        </div>
        <ModeSwitcher mode={mode} className="w-full shrink-0 sm:w-72" />
      </div>
    </section>
  )
}
