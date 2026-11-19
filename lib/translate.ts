import 'server-only'

export const SYNOPSIS_LANGS = [
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

export type SynopsisLang = (typeof SYNOPSIS_LANGS)[number]['id']

export function isSynopsisLang(v: string): v is SynopsisLang {
  return SYNOPSIS_LANGS.some((l) => l.id === v)
}

const g = globalThis as unknown as { __syTr?: Map<string, string> }
const memo = (g.__syTr ??= new Map())

function chunks(text: string, size = 1500) {
  const out: string[] = []
  let buf = ''
  for (const part of text.split(/(\n+)/)) {
    if ((buf + part).length > size && buf) {
      out.push(buf)
      buf = ''
    }
    buf += part
  }
  if (buf) out.push(buf)
  return out
}

async function google(text: string, to: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 }, headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`google ${res.status}`)
  const json = (await res.json()) as [[string, string][]]
  return json[0].map((s) => s[0]).join('')
}

async function myMemory(text: string, to: string) {
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=en|${to}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  })
  if (!res.ok) throw new Error(`mymemory ${res.status}`)
  const json = (await res.json()) as { responseData?: { translatedText?: string } }
  if (!json.responseData?.translatedText) throw new Error('mymemory empty')
  return json.responseData.translatedText
}

/** Translates plain text with keyless public endpoints; returns null when every provider fails. */
export async function translate(text: string, to: SynopsisLang): Promise<string | null> {
  if (!text.trim()) return ''
  const key = `${to}:${text.length}:${text.slice(0, 64)}`
  const hit = memo.get(key)
  if (hit) return hit
  try {
    const parts = await Promise.all(chunks(text).map((c) => google(c, to)))
    const result = parts.join('')
    memo.set(key, result)
    return result
  } catch {
    try {
      const result = await myMemory(text, to)
      memo.set(key, result)
      return result
    } catch {
      return null
    }
  }
}
