// SYTHERIS · hydration/script uyarılarını kapat
// Çalıştır: node duzelt.mjs
import { promises as fs } from 'fs'
import path from 'path'

const ROOT = process.cwd()
const YEDEK = path.join(ROOT, `.duzelt-yedek-${Date.now()}`)
const log = []

async function yaz(rel, icerik) {
  const abs = path.join(ROOT, rel)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  try {
    const bak = path.join(YEDEK, rel)
    await fs.mkdir(path.dirname(bak), { recursive: true })
    await fs.copyFile(abs, bak)
  } catch {}
  await fs.writeFile(abs, icerik, 'utf8')
  log.push(`✅ ${rel}`)
}

await yaz(
  'app/layout.tsx',
  `import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
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
      <head>
        <script id="sy-boot-script" dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <script
          id="sw-register"
          dangerouslySetInnerHTML={{
            __html: \`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}\`,
          }}
        />
      </head>
      <body className="min-h-dvh overflow-x-hidden" suppressHydrationWarning>
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
  'app/admin/layout.tsx',
  `import type { Metadata } from 'next'
import { isAdmin } from '@/lib/session'
import { AdminLogin } from '@/components/admin/admin-login'

export const metadata: Metadata = { title: 'Yönetim paneli', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) return <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />
  return (
    <div className="min-h-dvh bg-background" suppressHydrationWarning>
      {children}
    </div>
  )
}
`,
)

console.log('\n━━━ DÜZELTİLDİ ━━━\n')
for (const l of log) console.log(l)
console.log(`\n📦 Yedek: ${path.relative(ROOT, YEDEK)}`)
console.log('\nSırada:')
console.log('  Remove-Item -Recurse -Force .next')
console.log('  pnpm dev\n')