export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET() {
  const out: Record<string, unknown> = {}

  try {
    const res = await fetch('https://hanime.tv/', { headers: { 'User-Agent': UA } })
    const text = await res.text()
    out.html = { status: res.status, len: text.length, vendor: /vendor\.[a-z0-9]+\.min\.js/i.test(text) }
  } catch (err) {
    out.html = String(err)
  }

  try {
    const res = await fetch('https://auth.hanime.tv/api/v11/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: '{"token":"x"}',
    })
    const text = await res.text()
    out.handshake = { status: res.status, head: text.slice(0, 60) }
  } catch (err) {
    out.handshake = String(err)
  }

  return Response.json(out)
}