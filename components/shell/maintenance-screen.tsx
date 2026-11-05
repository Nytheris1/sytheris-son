import Link from 'next/link'
import { Wrench } from 'lucide-react'
import type { SiteSettings } from '@/lib/site'

export function MaintenanceScreen({ settings }: { settings: SiteSettings }) {
  return (
    <main className="dark relative grid min-h-dvh place-items-center overflow-hidden bg-scrim px-6 text-on-scrim">
      <div className="grain absolute inset-0" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(-45deg, var(--primary) 0 2px, transparent 2px 28px)' }}
        aria-hidden="true"
      />
      <div className="relative flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_60px_var(--primary)]">
          <Wrench className="size-7" />
        </div>
        <p className="label-mono text-primary">Bakım modu</p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {settings.maintenanceTitle.split(' ').slice(0, -1).join(' ')} <span className="font-serif font-normal italic text-primary">{settings.maintenanceTitle.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-pretty leading-relaxed text-on-scrim/70">{settings.maintenanceMessage}</p>
        {settings.maintenanceEta && (
          <p className="rounded-full border border-on-scrim/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-on-scrim/80">
            Tahmini dönüş: {settings.maintenanceEta}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-on-scrim/40">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          SYTHERIS
          <Link href="/admin" className="ml-4 underline-offset-4 hover:text-on-scrim hover:underline">
            Yönetici
          </Link>
        </div>
      </div>
    </main>
  )
}
