import { handle } from '@/lib/stream-relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export function GET(req: Request) {
  return handle(req, 'GET')
}

export function HEAD(req: Request) {
  return handle(req, 'HEAD')
}
