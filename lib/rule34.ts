import 'server-only'

const BASE = 'https://rule34.xxx/index.php'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type R34Post = { id: string; file: string; preview: string; kind: 'image' | 'video'; tags: string[]; score: number }

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: 'https://rule34.xxx/',
}

const VIDEO = /\.(mp4|webm)$/i

/** The DAPI needs an account key now, so the list page is scraped instead. */
export async function searchR34(tags: string, page = 1) {
  const p = new URLSearchParams()
  p.set('page', 'post')
  p.set('s', 'list')
  p.set('pid', String((Math.max(1, page) - 1) * 42))
  if (tags) p.set('tags', tags)

  const res = await fetch(BASE + '?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('rule34 ' + res.status)
  const html = await res.text()

  const items: R34Post[] = []
  for (const chunk of html.split('class="thumb"').slice(1)) {
    const id = (chunk.match(/[?&]id=(\d+)/) || [])[1]
    if (!id) continue
    const src = (chunk.match(/(?:data-src|src)="([^"]+)"/) || [])[1] || ''
    const title = (chunk.match(/title="([^"]*)"/) || [])[1] || ''
    const file = src.replace('/thumbnails/', '/images/').replace(/thumbnail_/i, '')
    const kind: 'image' | 'video' = VIDEO.test(file) || VIDEO.test(src) ? 'video' : 'image'
    items.push({
      id,
      file,
      preview: src,
      kind,
      tags: title.split(/\s+/).filter(Boolean).slice(0, 12),
      score: 0,
    })
  }

  return { items, hasNext: items.length >= 30 }
}