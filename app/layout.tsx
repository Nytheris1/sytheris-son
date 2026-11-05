import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import Script from 'next/script'
import { AppProviders } from '@/components/providers/app-providers'
import { MaintenanceScreen } from '@/components/shell/maintenance-screen'
import { getSettings } from '@/lib/site'
import { isAdmin } from '@/lib/session'
import { THEME_SCRIPT } from '@/lib/themes'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-bricolage', display: 'swap' })
const instrument = Instrument_Serif({ subsets: ['latin', 'latin-ext'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-jetbrains', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://sytheris.vercel.app'

const BOOT_SCRIPT = `${THEME_SCRIPT};try{if(sessionStorage.getItem('sy-intro-seen')||localStorage.getItem('sy-intro')==='0')document.documentElement.classList.add('intro-seen')}catch(e){}`

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
      className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} bg-background`}
    >
      <body className="min-h-dvh overflow-x-hidden" suppressHydrationWarning>
        <Script
          id="sy-boot-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }}
        />
        <AppProviders introEnabled={settings.introEnabled}>
          {showMaintenance ? <MaintenanceScreen settings={settings} /> : children}
        </AppProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
