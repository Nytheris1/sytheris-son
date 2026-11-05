'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Cpu, Loader2, RotateCcw, Sparkles, Square, X } from 'lucide-react'
import { getPrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'assistant'; content: string; provider?: string }

const SUGGESTIONS = ['Frieren gibi sakin bir fantastik anime öner', 'Bu sezonun en iyi aksiyon animeleri neler?', 'Kısa ve bitmiş bir psikolojik gerilim öner', 'Yeni başlayanlar için 5 anime']

const SYSTEM = `Sen "Sytheris AI"sın: Sytheris anime keşif platformunun Türkçe konuşan asistanısın. Her zaman Türkçe yanıt ver, emoji kullanma. Anime önerirken 3-5 başlık ver, başlıkları **kalın** yaz, her biri için tek cümlelik neden ekle. Spoiler verme.`

let ollamaStatus: { url: string; ok: boolean; at: number } | null = null

async function ollamaAvailable(url: string) {
  if (ollamaStatus && ollamaStatus.url === url && Date.now() - ollamaStatus.at < 60_000) return ollamaStatus.ok
  try {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 1200)
    const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, { signal: ctrl.signal })
    window.clearTimeout(t)
    ollamaStatus = { url, ok: res.ok, at: Date.now() }
  } catch {
    ollamaStatus = { url, ok: false, at: Date.now() }
  }
  return ollamaStatus.ok
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))
}

export function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (!list.length) return
    out.push(
      <ul key={`l${out.length}`} className="my-1 flex flex-col gap-1.5 pl-1">
        {list.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{renderInline(l)}</span>
          </li>
        ))}
      </ul>,
    )
    list = []
  }
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (m) list.push(m[1])
    else {
      flush()
      if (line.trim()) out.push(<p key={i}>{renderInline(line.replace(/^#+\s*/, ''))}</p>)
    }
  })
  flush()
  return <div className="flex flex-col gap-2">{out}</div>
}

export function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const history: Msg[] = [...messages, { role: 'user', content }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    const ctrl = new AbortController()
    abort.current = ctrl
    const prefs = getPrefs()
    const append = (chunk: string, provider?: string) =>
      setMessages((list) => {
        const next = [...list]
        const last = next[next.length - 1]
        next[next.length - 1] = { ...last, content: last.content + chunk, provider: provider ?? last.provider }
        return next
      })

    try {
      let usedLocal = false
      if (prefs.aiProvider !== 'gemini' && (await ollamaAvailable(prefs.ollamaUrl))) {
        try {
          const res = await fetch(`${prefs.ollamaUrl.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            signal: ctrl.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: prefs.ollamaModel, stream: true, messages: [{ role: 'system', content: SYSTEM }, ...history.map(({ role, content }) => ({ role, content }))] }),
          })
          if (res.ok && res.body) {
            usedLocal = true
            const reader = res.body.getReader()
            const dec = new TextDecoder()
            let buf = ''
            append('', `Ollama · ${prefs.ollamaModel}`)
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              buf += dec.decode(value, { stream: true })
              const lines = buf.split('\n')
              buf = lines.pop() ?? ''
              for (const l of lines) {
                if (!l.trim()) continue
                try {
                  const t = JSON.parse(l).message?.content
                  if (t) append(t)
                } catch {}
              }
            }
          }
        } catch (e) {
          if ((e as Error).name === 'AbortError') throw e
        }
      }
      if (!usedLocal) {
        if (prefs.aiProvider === 'ollama') append('', 'Ollama erişilemedi → bulut')
        const res = await fetch('/api/ai', {
          method: 'POST',
          signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), provider: prefs.aiProvider }),
        })
        const provider = res.headers.get('X-AI-Provider')
        append('', provider === 'gemini' ? 'Gemini' : provider === 'ollama' ? 'Ollama (sunucu)' : 'Hata')
        if (!res.body) throw new Error(await res.text())
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          append(dec.decode(value, { stream: true }))
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') append('\nBir hata oluştu, lütfen tekrar dene.')
    } finally {
      setBusy(false)
      abort.current = null
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Asistanı kapat' : 'Sytheris AI asistanını aç'}
        aria-expanded={open}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-24 left-4 z-[60] grid size-12 place-items-center rounded-full border border-white/20 bg-primary/80 text-primary-foreground shadow-[0_10px_40px_-8px_var(--primary)] backdrop-blur-xl transition-colors hover:bg-primary md:bottom-6 md:left-auto md:right-6 md:size-14"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? 'x' : 's'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            {open ? <X className="size-5" /> : <Sparkles className="size-5 md:size-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Sytheris AI"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-3 bottom-40 top-20 z-[60] flex origin-bottom-left flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/40 shadow-2xl backdrop-blur-3xl dark:bg-black/40 md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(640px,75vh)] md:w-[420px] md:origin-bottom-right"
          >
            <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4 bg-white/10 dark:bg-black/20">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Sytheris <span className="accent-serif">AI</span>
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cpu className="size-3" /> Ollama (yerel) + Gemini yedekli
                </p>
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={() => setMessages([])} aria-label="Sohbeti temizle" className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10">
                  <RotateCcw className="size-4" />
                </button>
              )}
            </header>

            <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-4" aria-live="polite">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col justify-end gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      Ne izlesem <span className="accent-serif">bugün?</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Ruh haline, sevdiğin animelere ya da türlere göre öneri iste.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} type="button" onClick={() => send(s)} className="rounded-2xl border border-white/20 bg-white/20 px-4 py-3 text-left text-sm backdrop-blur-sm transition hover:border-primary/50 hover:bg-white/40 dark:bg-black/20 dark:hover:bg-black/40">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn('flex flex-col gap-1', m.role === 'user' ? 'items-end' : 'items-start')}>
                      {m.role === 'assistant' && m.provider && <span className="label-mono text-[9px] text-muted-foreground">{m.provider}</span>}
                      <div
                        className={cn(
                          'max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                          m.role === 'user' ? 'rounded-br-lg bg-primary text-primary-foreground' : 'rounded-bl-lg border border-white/10 bg-white/30 text-foreground/90 backdrop-blur-md dark:bg-black/40',
                        )}
                      >
                        {m.role === 'assistant' ? m.content ? <RichText text={m.content} /> : <Loader2 className="size-4 animate-spin text-muted-foreground" /> : m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="border-t border-white/10 p-3 bg-white/10 dark:bg-black/20"
            >
              <div className="flex items-end gap-2 rounded-3xl border border-white/20 bg-white/20 p-1.5 pl-4 backdrop-blur-md transition focus-within:border-primary/50 focus-within:bg-white/30 dark:bg-black/20 dark:focus-within:bg-black/40">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      if (e.nativeEvent.isComposing || e.keyCode === 229) return
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  rows={1}
                  placeholder="Bir şey sor…"
                  aria-label="Mesaj"
                  className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                {busy ? (
                  <button type="button" onClick={() => abort.current?.abort()} aria-label="Durdur" className="grid size-10 place-items-center rounded-full bg-foreground text-background">
                    <Square className="size-3.5" />
                  </button>
                ) : (
                  <button type="submit" disabled={!input.trim()} aria-label="Gönder" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-40">
                    <ArrowUp className="size-4" />
                  </button>
                )}
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}