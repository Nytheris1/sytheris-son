'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Loader2, Search, X } from 'lucide-react'

/** Marquee-framed search field. Typing updates the URL (debounced) so results stream in from the server. */
export function CineSearchBox({ initial, kind }: { initial: string; kind: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initial)
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const last = useRef(initial)

  useEffect(() => {
    const term = value.trim()
    if (term === last.current) return
    const t = window.setTimeout(() => {
      last.current = term
      const sp = new URLSearchParams()
      if (term) sp.set('q', term)
      if (kind !== 'hepsi') sp.set('tur', kind)
      start(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ''}`, { scroll: false }))
    }, 380)
    return () => window.clearTimeout(t)
  }, [value, kind, pathname, router])

  return (
    <form
      role="search"
      action={pathname}
      onSubmit={(e) => {
        e.preventDefault()
        inputRef.current?.blur()
      }}
      className="relative"
    >
      <span className="cine-bulbs absolute inset-x-6 -top-2 h-4 -translate-y-1/2" aria-hidden="true" />
      <span className="cine-bulbs absolute inset-x-6 -bottom-2 h-4 translate-y-1/2" aria-hidden="true" />
      <label className="relative flex h-20 items-center gap-4 rounded-2xl border border-primary/40 bg-scrim/80 px-5 shadow-[0_0_80px_-30px_var(--primary)] backdrop-blur-md transition focus-within:border-primary sm:h-24 sm:px-7">
        <span className="sr-only">Film veya dizi ara</span>
        {pending ? <Loader2 className="size-6 shrink-0 animate-spin text-primary" aria-hidden="true" /> : <Search className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        <input
          ref={inputRef}
          name="q"
          type="search"
          autoFocus={!initial}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="Film, dizi ya da yönetmen…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-[-0.02em] text-foreground outline-none placeholder:text-foreground/30 sm:text-4xl [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
            className="grid size-10 shrink-0 place-items-center rounded-full text-foreground/60 transition hover:bg-foreground/10 hover:text-foreground"
            aria-label="Aramayı temizle"
          >
            <X className="size-5" />
          </button>
        )}
      </label>
    </form>
  )
}
