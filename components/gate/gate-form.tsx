'use client'

import { ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { unlockGate, type GateState } from '@/app/kapi/actions'
import { cn } from '@/lib/utils'
import { MistBackdrop, MistBrand, MistRule } from './mist-scene'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties

export function GateForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<GateState, FormData>(unlockGate, {})
  const [reveal, setReveal] = useState(false)
  const [opening, setOpening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ids = { key: useId(), remember: useId(), status: useId() }
  const locked = Boolean(state.retryIn)

  useEffect(() => {
    if (!state.next) return
    setOpening(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => window.location.assign(state.next!), reduce ? 0 : 1100)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    if (state.error) inputRef.current?.select()
  }, [state])

  return (
    <main className={cn('mist relative isolate flex min-h-dvh flex-col overflow-hidden', opening && 'gate-open')}>
      <MistBackdrop src="/gate/mist-gate.webp" />
      <div className="mist-veil" aria-hidden="true" />

      <header className="gate-rise flex items-center justify-between px-6 pt-6 md:px-12 md:pt-9" style={d(0)}>
        <MistBrand />
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--mist-soft)]">
          <Lock className="size-3.5" aria-hidden="true" />
          Özel alan
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <p className="gate-rise font-mono text-[11px] uppercase tracking-[0.42em] text-[var(--mist-soft)]" style={d(120)}>
          Davetliler için
        </p>
        <h1 className="gate-rise mist-title mt-5 text-balance text-6xl sm:text-7xl md:text-8xl" style={d(220)}>
          Kapı kapalı
        </h1>
        <MistRule className="mt-7" />
        <p className="gate-rise mt-7 max-w-md text-pretty text-[15px] leading-relaxed text-[var(--mist-soft)]" style={d(380)}>
          Sis dağılmadan geçit açılmaz. Sana verilen erişim anahtarını yaz; doğru anahtarla yol kendiliğinden belirir.
        </p>

        <form action={action} className="gate-rise mt-10 flex w-full max-w-sm flex-col gap-5" style={d(480)} aria-describedby={ids.status}>
          <input type="hidden" name="next" value={next} />
          <label htmlFor={ids.key} className="sr-only">
            Erişim anahtarı
          </label>
          <div className="mist-field flex items-center gap-3" data-error={Boolean(state.error)}>
            <input
              ref={inputRef}
              id={ids.key}
              name="key"
              type={reveal ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              required
              spellCheck={false}
              disabled={pending || locked || opening}
              placeholder="Erişim anahtarı"
              aria-invalid={Boolean(state.error)}
              className="h-14 min-w-0 flex-1 bg-transparent text-center font-mono text-lg tracking-[0.3em] text-[var(--mist-ink)] outline-none placeholder:font-serif placeholder:text-xl placeholder:italic placeholder:tracking-normal placeholder:text-[var(--mist-soft)] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--mist-soft)] transition-colors hover:text-[var(--mist-ink)]"
              aria-label={reveal ? 'Anahtarı gizle' : 'Anahtarı göster'}
              aria-pressed={reveal}
            >
              {reveal ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor={ids.remember} className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-[var(--mist-soft)]">
              <input id={ids.remember} name="remember" type="checkbox" className="size-4 accent-[oklch(0.22_0.012_230)]" />
              30 gün hatırla
            </label>
            <button
              type="submit"
              disabled={pending || locked || opening}
              className="group flex h-12 items-center gap-2.5 rounded-full bg-[var(--mist-ink)] px-6 text-sm font-semibold text-[var(--mist-bg)] shadow-[0_14px_30px_-14px_oklch(0.2_0.02_230/0.7)] transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {opening ? 'Sis dağılıyor' : pending ? 'Bakılıyor' : 'Geçidi aç'}
              {!pending && !opening && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
            </button>
          </div>

          <p id={ids.status} role="status" aria-live="polite" className={cn('min-h-5 text-sm', state.error ? 'text-[oklch(0.5_0.2_25)]' : 'text-[var(--mist-soft)]')}>
            {state.error ? (
              <>
                {state.error}
                {state.retryIn ? ` Yaklaşık ${state.retryIn} dakika sonra tekrar dene.` : ''}
              </>
            ) : opening ? (
              'Hoş geldin. Yol açılıyor…'
            ) : null}
          </p>
        </form>
      </section>

      <footer className="gate-rise flex flex-col items-center gap-1 px-6 pb-7 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--mist-soft)] md:flex-row md:justify-between md:px-12" style={d(600)}>
        <span>İmzalı erişim · HMAC-SHA256</span>
        <span>Hatalı denemeler kayda geçer</span>
      </footer>
    </main>
  )
}
