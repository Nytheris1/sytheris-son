import type { SiteSettings } from '@/lib/site'
import { MistBackdrop, MistBrand, MistRule } from '@/components/gate/mist-scene'
import { MaintenanceCountdown } from './maintenance-countdown'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties

/** Accepts an ISO date/time ("2026-12-01T18:00") as ETA; anything else is shown as plain text. */
function parseEta(eta?: string | null) {
  if (!eta) return null
  const t = Date.parse(eta)
  return Number.isFinite(t) && t > Date.now() ? t : null
}

export function MaintenanceScreen({ settings }: { settings: SiteSettings }) {
  const target = parseEta(settings.maintenanceEta)

  return (
    <main className="mist relative isolate flex min-h-dvh flex-col overflow-hidden">
      <MistBackdrop src="/gate/mist-maintenance.webp" />

      <header className="gate-rise flex items-center justify-between px-6 pt-6 md:px-12 md:pt-9" style={d(0)}>
        <MistBrand />
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--mist-soft)]">
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--mist-ink)]" aria-hidden="true" />
          Bakım molası
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <p className="gate-rise font-mono text-[11px] uppercase tracking-[0.42em] text-[var(--mist-soft)]" style={d(120)}>
          Ejderha uyurken onarıyoruz
        </p>
        <h1 className="gate-rise mist-title mt-5 max-w-4xl text-balance text-5xl sm:text-7xl md:text-8xl" style={d(220)}>
          {settings.maintenanceTitle}
        </h1>
        <MistRule className="mt-7" />
        <p className="gate-rise mt-7 max-w-lg text-pretty text-[15px] leading-relaxed text-[var(--mist-soft)]" style={d(380)}>
          {settings.maintenanceMessage}
        </p>
        <div className="gate-rise mt-12" style={d(480)}>
          {target ? (
            <MaintenanceCountdown target={target} />
          ) : settings.maintenanceEta ? (
            <p className="flex flex-col items-center gap-2">
              <span className="mist-numeral text-4xl sm:text-5xl">{settings.maintenanceEta}</span>
              <span className="text-xs tracking-wide text-[var(--mist-soft)]">Tahmini dönüş</span>
            </p>
          ) : null}
        </div>
      </section>

      <footer className="gate-rise flex flex-col items-center gap-1 px-6 pb-7 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--mist-soft)] md:flex-row md:justify-between md:px-12" style={d(600)}>
        <span>Verilerin güvende · hiçbir şey silinmez</span>
        <span>Sayfa açık kalırsa kendiliğinden yenilenir</span>
      </footer>
      <meta httpEquiv="refresh" content="300" />
    </main>
  )
}
