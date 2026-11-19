import 'server-only'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const REFERER = 'https://xhamster.com/'

export type PornSource = { label: string; url: string }

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: REFERER,
}

/** Eporner titles carry suffixes like "(HD) / 12 min" that only hurt the search. */
function clean(title: string) {
  return title
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

async function firstVideo(title: string): Promise<string | null> {
  const q = clean(title)
  if (!q) return null
  const res = await fetch('https://xhamster.com/search/' + encodeURIComponent(q), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('arama ' + res.status)
  const html = await res.text()
  const m = html.match(/href="(https:\/\/xhamster\.com\/videos\/[^"?#]+)"/) || html.match(/href="(\/videos\/[^"?#]+)"/)
  if (!m) return null
  return m[1].startsWith('http') ? m[1] : 'https://xhamster.com' + m[1]
}

/** The player config sits in window.initials; its sources map holds direct mp4/hls links. */
export async function resolveSourcesByTitle(title: string): Promise<PornSource[]> {
  const page = await firstVideo(title)
  if (!page) return []

  const res = await fetch(page, { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('sayfa ' + res.status)
  const html = await res.text()

  const at = html.indexOf('window.initials')
  if (at < 0) throw new Error('initials yok')
  const start = html.indexOf('{', at)
  const end = html.indexOf('</script>', start)
  if (start < 0 || end < 0) throw new Error('json sinir')

  let data: { sources?: Record<string, Record<string, string>> }
  try {
    data = JSON.parse(html.slice(start, end).trim().replace(/;\s*$/, ''))
  } catch {
    throw new Error('json cozulemedi')
  }

  const out: PornSource[] = []
  for (const group of ['mp4', 'hls']) {
    const bucket = data.sources?.[group]
    if (!bucket) continue
    for (const [label, url] of Object.entries(bucket)) {
      if (typeof url === 'string' && url.startsWith('http')) {
        out.push({ label: group === 'hls' ? 'hls' : label.replace(/[^0-9a-zA-Z]/g, ''), url })
      }
    }
  }
  out.sort((a, b) => (parseInt(b.label) || 0) - (parseInt(a.label) || 0))
  return out
}