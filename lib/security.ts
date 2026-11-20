/**
 * Edge-safe hardening helpers for the proxy: response headers, scanner filtering, method policy,
 * body caps, rate-limit budgets and origin binding. No Node APIs here.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-DNS-Prefetch-Control': 'on',
  'Origin-Agent-Cluster': '?1',
  'X-Download-Options': 'noopen',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
}

export function harden(headers: Headers) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value)
  return headers
}

/** Paths that exist on almost every framework but not on ours. Answered with 403 before Next is even reached. */
const SCANNER_PATHS: RegExp[] = [
  /^\/\.env/i,
  /^\/\.git(\/|$)/i,
  /^\/\.svn(\/|$)/i,
  /^\/\.hg(\/|$)/i,
  /^\/\.DS_Store$/i,
  /^\/\.htaccess$/i,
  /^\/\.vscode(\/|$)/i,
  /^\/\.idea(\/|$)/i,
  /^\/wp-(admin|login|content|includes|json)/i,
  /^\/xmlrpc\.php$/i,
  /^\/phpmyadmin/i,
  /^\/pma(\/|$)/i,
  /^\/vendor\/(phpunit|composer|autoload)/i,
  /^\/_profiler/i,
  /^\/cgi-bin\//i,
  /^\/server-status$/i,
  /^\/actuator/i,
  /^\/console$/i,
  /^\/solr(\/|$)/i,
  /^\/HNAP1/i,
  /^\/telescope/i,
  /^\/package\.json$/i,
  /^\/package-lock\.json$/i,
  /^\/pnpm-lock\.yaml$/i,
  /^\/tsconfig\.json$/i,
  /^\/web\.config$/i,
  /^\/(admin|index|config|info|setup|install)\.php$/i,
  /^\/(backup|backups|db|database)(\/|$|\.)/i,
]

export function isBlockedPath(pathname: string) {
  return SCANNER_PATHS.some((re) => re.test(pathname))
}

const BOT_UA =
  /^(curl|wget|python|go-http-client|java|libwww|httpclient|okhttp|axios|node-fetch|undici|guzzle|postmanruntime|insomnia|masscan|zgrab|nmap|sqlmap|nikto|nuclei|gobuster|dirbuster|wfuzz|ffuf|feroxbuster|httpx|headlesschrome|phantomjs|scrapy|aiohttp|reqwest)/i

/** Scripted clients. Only consulted for page navigations, and only when the browser hints are missing. */
export function isBotClient(userAgent: string) {
  const ua = userAgent.trim()
  return !ua || BOT_UA.test(ua)
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Server actions POST back to the page URL, so the Next-Action header has to widen the policy. */
export function methodAllowed(method: string, pathname: string, isAction: boolean) {
  if (SAFE_METHODS.has(method)) return true
  if (isAction) return true
  if (pathname === '/kapi') return true
  return pathname.startsWith('/api/')
}

const BODY_LIMITS: Array<[RegExp, number]> = [
  [/^\/api\/(upload|subtitle\/upload|fullbody)(\/|$)/, 12 * 1024 * 1024],
  [/^\/api\//, 1024 * 1024],
]

export function bodyLimit(pathname: string, isAction: boolean) {
  for (const [re, max] of BODY_LIMITS) if (re.test(pathname)) return max
  return isAction ? 8 * 1024 * 1024 : 0
}

export type LimitRule = { name: string; max: number; window: number }

const RULES: Array<[RegExp, LimitRule]> = [
  [/^\/api\/h\/relay/, { name: 'relay', max: 1500, window: 60000 }],
  [/^\/api\/(porn\/thumb|manga\/img|r34\/file|kapak|proxy|medya|fullbody\/img|korku\/still|gifs)/, { name: 'img', max: 900, window: 60000 }],
  [/^\/api\/(stream|torrents|h\/sources|porn\/sources)/, { name: 'feed', max: 150, window: 60000 }],
  [/^\/api\/(search|synopsis|music\/search|film|anime|manga|r34|h\/health)/, { name: 'query', max: 90, window: 60000 }],
  [/^\/api\/ai/, { name: 'ai', max: 30, window: 60000 }],
  [/^\/api\/auth\//, { name: 'auth', max: 15, window: 300000 }],
  [/^\/api\/(upload|subtitle\/upload)/, { name: 'upload', max: 25, window: 60000 }],
  [/^\/api\/indir/, { name: 'indir', max: 10, window: 300000 }],
]

export function limitRule(pathname: string): LimitRule | null {
  for (const [re, rule] of RULES) if (re.test(pathname)) return rule
  return null
}

/**
 * Binds state-changing requests to our own origin. Origin wins when present; otherwise the
 * Sec-Fetch-Site hint; otherwise the Referer host. Cross-site form posts fail all three.
 */
export function sameOrigin(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase()
  if (!host) return true

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const parsed = new URL(origin)
      return parsed.host.toLowerCase() === host
    } catch {
      return false
    }
  }

  if (request.headers.get('sec-fetch-site') === 'cross-site') return false

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === host
    } catch {
      return false
    }
  }

  return true
}