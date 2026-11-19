'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({ code, file }: { code: string; file?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <figure className="dark overflow-hidden rounded-2xl border border-border bg-scrim text-foreground">
      <figcaption className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-2.5">
        <span className="truncate font-mono text-[11px] text-foreground/60">{file ?? 'kod'}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code).catch(() => {})
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1400)
          }}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground/85">
        <code>{code}</code>
      </pre>
    </figure>
  )
}
