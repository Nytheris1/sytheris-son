/**
 * Fixed-window, per-instance limiter. No Node APIs and no `server-only` marker so the proxy
 * (edge runtime) can use it too. Per-instance is enough to blunt scripted abuse; credential
 * endpoints add their own stricter lockouts.
 */

type Bucket = Map<string, { n: number; at: number }>
const g = globalThis as unknown as { __syRate?: Map<string, Bucket> }
const buckets = (g.__syRate ??= new Map())

/** Client IP as reported by the platform edge. `x-real-ip` is set by Vercel and can't be spoofed by the client. */
export function clientIp(headers: Headers) {
  return headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

/** Returns the seconds to wait when the key is over its budget, otherwise 0. */
export function rateLimit(name: string, key: string, max: number, windowMs: number) {
  let bucket = buckets.get(name)
  if (!bucket) buckets.set(name, (bucket = new Map()))
  const now = Date.now()
  const hit = bucket.get(key)
  if (!hit || now - hit.at >= windowMs) {
    if (bucket.size > 5000) bucket.clear()
    bucket.set(key, { n: 1, at: now })
    return 0
  }
  hit.n += 1
  return hit.n > max ? Math.ceil((windowMs - (now - hit.at)) / 1000) : 0
}

export function tooMany(retryAfter: number, message = 'Çok fazla istek. Biraz sonra tekrar dene.') {
  return Response.json(
    { ok: false, error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    },
  )
}