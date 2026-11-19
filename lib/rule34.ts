import 'server-only'

const API = 'https://api.rule34.xxx/index.php'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type R34Post = {
  id: number
  file: string
  preview: string
  kind: 'image' | 'video'
  tags: string[]
  score: number
  width: number
  height: number
}

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function normalize(raw: Raw): R34Post | null {
  const file = str(raw.file_url)
  if (!file) return null
  const ext = str(raw.type) || file.split('.').pop() || ''
  return {
    id: num(raw.id),
    file,
    preview: str(raw.preview_url) || str(raw.sample_url) || file,
    kind: /mp4|webm/i.test(ext) ? 'video' : 'image',
    tags: str(raw.tags).split(' ').filter(Boolean),
    score: num(raw.score),
    width: num(raw.width),
    height: num(raw.height),
  }
}

export async function searchR34(tags: string, page = 1) {
  const user = process.env.R34_USER ?? ''
  const key = process.env.R34_KEY ?? ''
  if (!user || !key) throw new Error('R34_USER / R34_KEY tanimli degil')

  const p = new URLSearchParams({
    page: 'dapi',
    s: 'post',
    q: 'index',
    json: '1',
    limit: '60',
    pid: String(Math.max(0, page - 1)),
    tags,
    user_id: user,
    api_key: key,
  })

  const res = await fetch(API + '?' + p.toString(), { headers: { 'User-Agent': UA }, cache: 'no-store' })
  const text = await res.text()
  let data: Raw[] = []
  try {
    const parsed = JSON.parse(text)
    data = Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('rule34 ' + res.status + ' ' + text.replace(/\s+/g, ' ').slice(0, 90))
  }
  return { items: data.map(normalize).filter((x): x is R34Post => Boolean(x)), hasNext: data.length >= 60 }
}

export async function autocompleteR34(q: string) {
  if (q.trim().length < 2) return []
  const res = await fetch('https://api.rule34.xxx/autocomplete.php?q=' + encodeURIComponent(q.trim()), {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })
  const text = await res.text()
  try {
    const rows = JSON.parse(text) as { value: string; label: string }[]
    return rows.slice(0, 10).map((r) => r.value)
  } catch {
    return []
  }
}