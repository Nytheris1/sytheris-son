'use client'

import useSWR from 'swr'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Check, ChevronDown, Languages, Loader2 } from 'lucide-react'
import { setPrefs, usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { Popover } from '@/components/ui-kit/popover'

export const LANGS = [
  { id: 'tr', label: 'Türkçe', short: 'TR' },
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'ja', label: '日本語', short: 'JA' },
  { id: 'de', label: 'Deutsch', short: 'DE' },
  { id: 'fr', label: 'Français', short: 'FR' },
  { id: 'es', label: 'Español', short: 'ES' },
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'ar', label: 'العربية', short: 'AR' },
  { id: 'ko', label: '한국어', short: 'KO' },
  { id: 'az', label: 'Azərbaycanca', short: 'AZ' },
] as const

type Res = { ok: boolean; text: string; translated: boolean; fallback?: boolean }

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json() as Promise<Res>
  })

export function Synopsis({ id, original, initialTr }: { id: number; original: string; initialTr?: string | null }) {
  const prefs = usePrefs()
  const lang = prefs.synopsisLang
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading } = useSWR(original && lang !== 'en' ? `/api/synopsis?id=${id}&lang=${lang}` : null, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    fallbackData: lang === 'tr' && initialTr ? { ok: true, text: initialTr, translated: true } : undefined,
  })

  const text = lang === 'en' ? original : (data?.text ?? original)
  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0]
  const long = text.length > 420
  const rtl = lang === 'ar'

  if (!original) return <p className="text-muted-foreground">Açıklama bulunmuyor.</p>

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Popover
          align="start"
          label="Özet dili"
          trigger={({ open, toggle, ref }) => (
            <button
              ref={ref}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={toggle}
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm font-medium transition hover:border-primary"
            >
              <Languages className="size-4 text-ink" aria-hidden="true" />
              <span className="sr-only">Özet dili:</span>
              {current.label}
              <ChevronDown className={cn('size-3.5 opacity-60 transition', open && 'rotate-180')} aria-hidden="true" />
            </button>
          )}
        >
          {(close) => (
            <ul role="listbox" aria-label="Özet dili" className="grid w-60 grid-cols-2 gap-1 p-1.5">
              {LANGS.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={l.id === lang}
                    onClick={() => {
                      setPrefs({ synopsisLang: l.id })
                      close()
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition',
                      l.id === lang ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <span className="truncate">{l.label}</span>
                    {l.id === lang ? <Check className="size-3.5 shrink-0" /> : <span className="font-mono text-[10px] opacity-50">{l.short}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground" aria-live="polite">
          {isLoading ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Çevriliyor
            </>
          ) : lang === 'en' ? (
            'Orijinal metin · AniList'
          ) : data?.fallback ? (
            'Çeviri şu an alınamadı · orijinal gösteriliyor'
          ) : (
            'Otomatik çeviri · kaynak AniList'
          )}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${lang}-${data?.translated ? 't' : 'o'}`}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: isLoading ? 0.5 : 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          lang={lang}
          dir={rtl ? 'rtl' : 'ltr'}
          className={cn('whitespace-pre-line text-pretty text-lg leading-relaxed text-foreground/80', !expanded && long && 'line-clamp-6')}
        >
          {text}
        </motion.div>
      </AnimatePresence>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="w-fit font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-ink hover:underline">
          {expanded ? 'Daha az göster' : 'Devamını oku'}
        </button>
      )}
    </div>
  )
}
