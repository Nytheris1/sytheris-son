import 'server-only'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type PornSource = { label: string; url: string }

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: 'https://www.xnxx.com/',
}

/** Eporner titles carry suffixes like "(HD)" that only hurt the search. */
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
  const res = await fetch('https://www.xnxx.com/search/' + encodeURIComponent(q), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('arama ' + res.status)
  const html = await res.text()
  const m = html.match(/href="(\/video-[^"]+)"/)
  return m ? 'https://www.xnxx.com' + m[1] : null
}

/** XNXX puts the stream URLs straight into the page as html5player.setVideoUrlHigh/Low/HLS calls. */
export async function resolveSourcesByTitle(title: string): Promise<PornSource[]> {
  const page = await firstVideo(title)
  if (!page) return []

  const res = await fetch(page, { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('sayfa ' + res.status)
  const body = await res.text()

  const pick = (fn: string) => {
    const m = body.match(new RegExp(fn + "\\('([^']+)'\\)"))
    return m ? m[1].replace(/\\\//g, '/') : ''
  }

  const hls = pick('setVideoHLS')
  const high = pick('setVideoUrlHigh')
  const low = pick('setVideoUrlLow')

  const out: PornSource[] = []
  if (hls) out.push({ label: 'hls', url: hls })
  if (high) out.push({ label: 'yuksek', url: high })
  if (low) out.push({ label: 'dusuk', url: low })
  return out
}