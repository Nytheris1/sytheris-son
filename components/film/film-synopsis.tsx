'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function FilmSynopsis({ original, translated, kind = 'film' }: { original: string; translated: string | null; kind?: 'film' | 'dizi' }) {
  const [lang, setLang] = useState<'tr' | 'en'>(translated ? 'tr' : 'en')
  const text = lang === 'tr' && translated ? translated : original

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Konu <span className="accent-serif">özeti</span>
        </h2>
        {translated && (
          <div className="flex rounded-full bg-muted p-1" role="radiogroup" aria-label="Özet dili">
            {(['tr', 'en'] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cn('rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase transition', lang === l ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      {text ? <p className="text-pretty text-lg leading-relaxed text-foreground/85">{text}</p> : <p className="text-muted-foreground">Bu {kind} için özet bulunmuyor.</p>}
      {lang === 'tr' && translated && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Otomatik çeviri</p>}
    </div>
  )
}
