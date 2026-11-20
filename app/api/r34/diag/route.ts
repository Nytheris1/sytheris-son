export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const W = (process.env.HANIME_WORKER_URL || '').replace(/\/+$/, '')
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url')

export async function GET() {
  const target = 'https://rule34.xxx/index.php?page=post&s=list&tags=furry'
  const out: Record<string, unknown> = {}
  try {
    const direct = await fetch(target, { headers: { 'User-Agent': UA, Referer: 'https://rule34.xxx/' }, cache: 'no-store' })
    const b = await direct.text()
    out.direct = { status: direct.status, len: b.length, thumbs: (b.match(/class="thumb"/g) || []).length, cf: /just a moment/i.test(b) }
  } catch (e) {
    out.direct = { error: e instanceof Error ? e.message : 'hata' }
  }
  if (W) {
    try {
      const rr = await fetch(W + '/proxy?u=' + b64(target), { headers: { 'User-Agent': UA, Referer: 'https://rule34.xxx/' }, cache: 'no-store' })
      const b = await rr.text()
      out.worker = { status: rr.status, len: b.length, thumbs: (b.match(/class="thumb"/g) || []).length, cf: /just a moment/i.test(b) }
    } catch (e) {
      out.worker = { error: e instanceof Error ? e.message : 'hata' }
    }
  } else {
    out.worker = 'worker yok'
  }
  return Response.json(out)
}