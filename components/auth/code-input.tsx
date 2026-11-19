'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

/** Six single-digit boxes that behave like one field: typing advances, Backspace steps back, pasting fills all. */
export function CodeInput({ value, onChange, onComplete, disabled, tone = 'dark' }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; disabled?: boolean; tone?: 'dark' | 'light' }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  const set = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, 6)
    onChange(clean)
    if (clean.length === 6) onComplete?.(clean)
    return clean
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="6 haneli doğrulama kodu">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          aria-label={`${i + 1}. hane`}
          autoFocus={i === 0}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const typed = e.target.value.replace(/\D/g, '')
            if (!typed) return
            const next = set((value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, 6))
            refs.current[Math.min(next.length, 5)]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (d) set(value.slice(0, i) + value.slice(i + 1))
              else if (i > 0) {
                set(value.slice(0, i - 1) + value.slice(i))
                refs.current[i - 1]?.focus()
              }
            } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
            else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const next = set(e.clipboardData.getData('text'))
            refs.current[Math.min(next.length, 5)]?.focus()
          }}
          className={cn(
            'h-14 w-full min-w-0 rounded-xl border text-center font-mono text-2xl font-semibold tabular-nums outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:opacity-60',
            tone === 'dark' ? 'border-foreground/15 bg-foreground/5' : 'border-border bg-background',
            d && 'border-primary/60',
          )}
        />
      ))}
    </div>
  )
}
