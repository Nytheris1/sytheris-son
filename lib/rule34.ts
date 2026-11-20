import 'server-only'

const BASE = 'https://rule34.us/index.php'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type R34Post = { id: number; file: string; preview: string; kind: 'image' | 'video'; tags: string[]; score: number }

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: 'https://rule34.us/',
}

const VIDEO = /\.(mp4|webm)$/i

/** rule34.xxx blocks server requests now, so the keyless rule34.us mirror is scraped instead. */
export async function searchR34(tags: string, page = 1) {
  const p = new URLSearchParams()
  p.set('r', 'posts/index')
  p.set('q', tags.trim().replace(/\s+/g, '+'))
  p.set('page', String(Math.max(1, page)))

  const res = await fetch(BASE + '?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('rule34 ' + res.status)
  const html = await res.text()

  const items: R34Post[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(/posts\/view&amp;id=(\d+)/g)) {
    const id = m[1]
    if (seen.has(id)) continue
    seen.add(id)
    const at = m.index || 0
    const window = html.slice(Math.max(0, at - 700), at + 900)
    const img = (window.match(/src="(https:\/\/[^"]*thumbnail_[^"]+)"/) || [])[1] || ''
    if (!img) continue
    const title = (window.match(/title="([^"]*)"/) || [])[1] || ''
    const file = img.replace('/thumbnails/', '/images/').replace(/thumbnail_/i, '')
    items.push({
      id: Number(id),
      file,
      preview: img,
      kind: VIDEO.test(file) ? 'video' : 'image',
      tags: title.split(/\s+/).filter(Boolean).slice(0, 12),
      score: 0,
    })
  }

  const hasNext = items.length >= 30
  return { items, hasNext }
}