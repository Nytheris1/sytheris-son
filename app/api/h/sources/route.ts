import { NextRequest } from 'next/server'
import { getSources } from '@/lib/hanime/signer'
import { relayUrl } from '@/lib/hanime/relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const cache = new Map<string, { at: number; sources: { url: string; height: number; label: string }[] }>()
const TTL = 4 * 60 * 1000

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return Response.json({ error: 'slug gecersiz' }, { status: 400 })

  const hit = cache.get(slug)
  if (hit && Date.now() - hit.at < TTL) {
    return Response.json({ sources: hit.sources.map((s) => ({ ...s, url: relayUrl(s.url) })) })
  }

  try {
    const sources = await getSources(slug)
    cache.set(slug, { at: Date.now(), sources })
    return Response.json({ sources: sources.map((s) => ({ ...s, url: relayUrl(s.url) })) })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'kaynak hatasi' }, { status: 502 })
  }
}