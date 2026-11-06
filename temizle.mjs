// SYTHERIS · ilk hâle tam geri dönüş
// Çalıştır: node temizle.mjs
import { promises as fs } from 'fs'
import path from 'path'

const ROOT = process.cwd()
const YEDEK = path.join(ROOT, `.temizle-yedek-${Date.now()}`)
const log = []

async function sil(rel) {
  const abs = path.join(ROOT, rel)
  try {
    await fs.access(abs)
  } catch {
    log.push(`⏭️  ${rel} (yok)`)
    return
  }
  const hedef = path.join(YEDEK, rel)
  await fs.mkdir(path.dirname(hedef), { recursive: true })
  try {
    await fs.rename(abs, hedef)
    log.push(`🗑️  ${rel}`)
    return
  } catch {
    try {
      await fs.cp(abs, hedef, { recursive: true })
      await fs.rm(abs, { recursive: true, force: true, maxRetries: 6, retryDelay: 400 })
      log.push(`🗑️  ${rel}`)
    } catch (e) {
      log.push(`⚠️  ${rel} SİLİNEMEDİ (${e.code ?? e.message})`)
    }
  }
}

async function yaz(rel, icerik) {
  const abs = path.join(ROOT, rel)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  try {
    const bak = path.join(YEDEK, rel)
    await fs.mkdir(path.dirname(bak), { recursive: true })
    await fs.copyFile(abs, bak)
  } catch {}
  await fs.writeFile(abs, icerik, 'utf8')
  log.push(`↩️  ${rel}`)
}

async function yamala(rel, pairs) {
  const abs = path.join(ROOT, rel)
  let src
  try {
    src = await fs.readFile(abs, 'utf8')
  } catch {
    log.push(`❌ ${rel} (yok)`)
    return
  }
  let out = src
  for (const [re, to] of pairs) out = out.replace(re, to)
  if (out === src) {
    log.push(`⏭️  ${rel} (değişiklik yok)`)
    return
  }
  const bak = path.join(YEDEK, rel)
  await fs.mkdir(path.dirname(bak), { recursive: true })
  await fs.copyFile(abs, bak)
  await fs.writeFile(abs, out, 'utf8')
  log.push(`↩️  ${rel}`)
}

/* ---------- 1. eklenen dosyalar ---------- */
for (const rel of [
  'lib/hanime.ts',
  'lib/hentai.ts',
  'lib/fetch-json.ts',
  'lib/adult.ts',
  'app/api/hanime',
  'app/api/admin/hentai',
  'app/admin/hentai',
  'app/(site)/hentai',
  'components/adult',
  'components/admin/hanime-picker.tsx',
  'components/admin/hanime-browser.tsx',
  'components/admin/hentai-add-form.tsx',
  'components/admin/adult-anime-picker.tsx',
  'components/admin/adult-episode-form.tsx',
]) {
  await sil(rel)
}

/* ---------- 2. mjs yardımcıları ---------- */
for (const rel of ['fix-hentai.mjs', 'fix-hentai-add.mjs', 'probe-hanime.mjs', 'probe2.mjs']) {
  await sil(rel)
}

/* ---------- 3. orijinal dosyalar ---------- */
await yaz(
  'next.config.mjs',
  `/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    'webtorrent',
    'node-datachannel',
    'utp-native',
    'bufferutil',
    'utf-8-validate',
    '@consumet/extensions',
    'axios',
    'cheerio',
  ],
  outputFileTracingIncludes: {
    '/api/download': [
      './app/**/*',
      './components/**/*',
      './lib/**/*',
      './hooks/**/*',
      './public/**/*',
      './package.json',
      './pnpm-lock.yaml',
      './next.config.mjs',
      './postcss.config.mjs',
      './tsconfig.json',
      './components.json',
      './proxy.ts',
      './README.md',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
`,
)

await yaz(
  'app/admin/layout.tsx',
  `import type { Metadata } from 'next'
import { isAdmin } from '@/lib/session'
import { AdminLogin } from '@/components/admin/admin-login'

export const metadata: Metadata = { title: 'Yönetim paneli', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) return <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />
  return <div className="min-h-dvh bg-background">{children}</div>
}
`,
)

await yaz(
  'app/(site)/layout.tsx',
  `import { AiAssistant } from '@/components/ai/ai-assistant'
import { MusicMiniPlayer } from '@/components/music/music-mini-player'
import { MusicPanel } from '@/components/music/music-panel'
import { AnnouncementBar } from '@/components/shell/announcement-bar'
import { Intro } from '@/components/shell/intro'
import { MobileNav } from '@/components/shell/mobile-nav'
import { SiteFooter } from '@/components/shell/site-footer'
import { SiteHeader } from '@/components/shell/site-header'
import { getIntroCovers } from '@/lib/anilist'
import { getSettings } from '@/lib/site'
import { getCurrentUser } from '@/lib/users'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, user, covers] = await Promise.all([getSettings(), getCurrentUser(), getIntroCovers()])
  const headerUser = user ? { username: user.username, displayName: user.displayName, avatar: user.avatar } : null

  return (
    <>
      <Intro covers={covers} enabled={settings.introEnabled} />
      <AnnouncementBar text={settings.announcement} tone={settings.announcementTone} />
      <SiteHeader user={headerUser} />
      <main id="main" className="min-h-[70dvh]">
        {children}
      </main>
      <SiteFooter />
      <MobileNav username={user?.username} />
      {settings.aiEnabled && <AiAssistant />}
      <MusicMiniPlayer className="bottom-40 left-3 md:bottom-6 md:left-6" />
      <MusicPanel />
    </>
  )
}
`,
)

await yaz(
  'app/layout.tsx',
  `import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import Script from 'next/script'
import { AppProviders } from '@/components/providers/app-providers'
import { MaintenanceScreen } from '@/components/shell/maintenance-screen'
import { getSettings } from '@/lib/site'
import { isAdmin } from '@/lib/session'
import { THEME_SCRIPT } from '@/lib/themes'
import { FloatingInstall } from '@/components/ui/floating-install'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-bricolage', display: 'swap' })
const instrument = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-jetbrains', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? \`https://\${process.env.VERCEL_PROJECT_PRODUCTION_URL}\`
    : 'https://sytheris.vercel.app'

const BOOT_SCRIPT = \`\${THEME_SCRIPT};try{if(sessionStorage.getItem('sy-intro-seen')||localStorage.getItem('sy-intro')==='0')document.documentElement.classList.add('intro-seen')}catch(e){}\`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'SYTHERIS — Anime Keşif Platformu', template: '%s — SYTHERIS' },
  description: 'Trend animeler, Türkiye Top 10, fragmanlar, karakterler ve seslendirmenler. Sytheris ile yeni favori animeni keşfet ve izle.',
  applicationName: 'SYTHERIS',
  keywords: ['anime', 'anime izle', 'türkçe altyazı', 'anime keşif', 'anilist', 'sytheris'],
  openGraph: {
    type: 'website',
    siteName: 'SYTHERIS',
    locale: 'tr_TR',
    title: 'SYTHERIS — Anime Keşif Platformu',
    description: 'Trend animeler, Türkiye Top 10, fragmanlar ve daha fazlası.',
  },
  twitter: { card: 'summary_large_image', title: 'SYTHERIS — Anime Keşif Platformu', description: 'Trend animeler, Türkiye Top 10, fragmanlar ve daha fazlası.' },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#10d27f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, admin, h] = await Promise.all([getSettings(), isAdmin(), headers()])
  const pathname = h.get('x-pathname') ?? '/'
  const bypass = admin || pathname.startsWith('/admin') || pathname.startsWith('/api')
  const showMaintenance = settings.maintenance && !bypass

  return (
    <html
      lang="tr"
      data-theme="green"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={\`\${bricolage.variable} \${instrument.variable} \${jetbrains.variable} bg-background\`}
    >
      <body className="min-h-dvh overflow-x-hidden" suppressHydrationWarning>
        <Script
          id="sy-boot-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }}
        />

        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: \`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            \`,
          }}
        />

        <AppProviders introEnabled={settings.introEnabled}>
          {showMaintenance ? <MaintenanceScreen settings={settings} /> : children}
        </AppProviders>

        <FloatingInstall />

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
`,
)

await yaz(
  'app/api/proxy/route.ts',
  `import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const referer = searchParams.get('referer') || 'https://hianime.to'

  if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': referer,
      }
    })

    const data = await res.text()

    // Eğer m3u8 dosyasıysa içindeki alt linkleri de proxy'e çevir
    let finalData = data
    if (url.includes('.m3u8') || data.includes('#EXTM3U')) {
      // m3u8 içindeki göreceli linkleri (segmentleri) proxy'e yönlendir
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      finalData = data.split('\\n').map((line: string) => {
        if (line.trim() && !line.startsWith('#')) {
          // Mutlak URL ise direkt, göreceli ise birleştir
          const absUrl = line.startsWith('http') ? line : new URL(line, baseUrl).toString()
          return \`/api/proxy?url=\${encodeURIComponent(absUrl)}&referer=\${encodeURIComponent(referer)}\`
        }
        return line
      }).join('\\n')
    }

    return new NextResponse(finalData, {
      headers: {
        'Content-Type': url.includes('.ts') ? 'video/mp2t' : 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Proxy bağlantı hatası' }, { status: 500 })
  }
}
`,
)

await yaz(
  'app/api/stream/route.ts',
  `// SSL sertifika doğrulama hatasını aşmak için (Vercel ortamı için)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextResponse } from 'next/server'
import { ANIME } from '@consumet/extensions'

const provider = new ANIME.AnimePahe()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const epNum = searchParams.get('ep')

  if (!title || !epNum) {
    return NextResponse.json({ error: 'Başlık ve bölüm numarası gerekli' }, { status: 400 })
  }

  try {
    // 1. Animeyi ara
    const searchResults = await provider.search(title)

    if (!searchResults.results || searchResults.results.length === 0) {
      return NextResponse.json({ error: 'Anime AnimePahe üzerinde bulunamadı.' }, { status: 404 })
    }

    const anime = searchResults.results[0]

    // 2. Bölüm listesini al
    const info = await provider.fetchAnimeInfo(anime.id)

    if (!info.episodes || info.episodes.length === 0) {
      return NextResponse.json({ error: 'Bu anime için bölüm listesi bulunamadı.' }, { status: 404 })
    }

    // 3. İstenen bölümü bul
    const episode = info.episodes.find((e: any) => e.number === Number(epNum))
    if (!episode) {
      return NextResponse.json({ error: \`Bölüm \${epNum} bulunamadı.\` }, { status: 404 })
    }

    // 4. Bölümün video kaynaklarını çek
    const sources = await provider.fetchEpisodeSources(episode.id)

    if (!sources || !sources.sources || sources.sources.length === 0) {
      return NextResponse.json({ error: 'Video kaynakları çekilemedi.' }, { status: 404 })
    }

    // 5. M3U8 formatındaki kaynağı bul
    const source = sources.sources.find((s: any) => s.isM3U8) || sources.sources[0]

    return NextResponse.json({
      streamUrl: \`/api/proxy?url=\${encodeURIComponent(source.url)}\`,
      originalUrl: source.url
    })

  } catch (error: any) {
    console.error('Stream API Hatası:', error)

    let errorMessage = 'Bilinmeyen bir hata.'
    if (error.message) errorMessage = error.message
    else if (typeof error === 'string') errorMessage = error
    else if (error.toString) errorMessage = error.toString()

    return NextResponse.json({
      error: 'Sağlayıcı Hatası: ' + errorMessage
    }, { status: 500 })
  }
}
`,
)

/* ---------- 4. regex ile geri almalar ---------- */
await yamala('app/admin/page.tsx', [
  [/import \{ Activity, AlertTriangle, Cpu, Film, Flame, LayoutDashboard/, 'import { Activity, AlertTriangle, Cpu, Film, LayoutDashboard'],
  [/\s*<Link\s+href="\/admin\/hentai"[\s\S]*?<\/Link>/, ''],
])

await yamala('.env.local', [
  [/^HANIME_COOKIE=.*\r?\n/m, ''],
  [/^HANIME_UA=.*\r?\n/m, ''],
])

await yamala('lib/anilist.ts', [[/\n  isAdult\n/, '\n']])

await yamala('lib/anilist-types.ts', [[/\n  isAdult\?: boolean \| null\n/, '\n']])

await yamala('components/player/video-player.tsx', [
  [/const isHls = isHlsSource\(src\)/g, "const isHls = src.includes('.m3u8')"],
  [/if \(!isHlsSource\(src\)\)/g, "if (!src.includes('.m3u8'))"],
  [/\/\/ HLS algılama[\s\S]*?\ntype Props = \{/, 'type Props = {'],
])

await yamala('app/admin/actions.ts', [
  [
    /  const isUrl = \(u\?: string\) => \{\n    if \(!u\) return false\n    \/\/ Kendi proxy\/stream yollarımız göreli: \/api\/proxy\?url=\.\.\.\n    if \(u\.startsWith\('\/api\/'\)\) return true\n/,
    '  const isUrl = (u?: string) => {\n    if (!u) return false\n',
  ],
  [/\n*export async function addHentaiAction[\s\S]*$/, '\n'],
])

/* ---------- 5. rapor ---------- */
console.log('\n━━━ İLK HÂLE DÖNÜLDÜ ━━━\n')
for (const l of log) console.log(l)

const kalan = log.filter((l) => l.startsWith('⚠️'))
if (kalan.length) {
  console.log('\n⚠️  Elle silinecekler:')
  for (const l of kalan) console.log('   ' + l.split(' ')[1])
}

console.log(`\n📦 Yedek: ${path.relative(ROOT, YEDEK)}`)
console.log('\nSırada:')
console.log('  pnpm remove got-scraping')
console.log('  Remove-Item -Recurse -Force .next')
console.log('  pnpm dev\n')