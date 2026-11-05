import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// 1. KÖK LAYOUT (app/layout.tsx) - Tüm script, font ve CSS burada
const rootLayoutContent = `import { Analytics } from '@vercel/analytics/next'
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
        <AppProviders introEnabled={settings.introEnabled}>
          {showMaintenance ? <MaintenanceScreen settings={settings} /> : children}
        </AppProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
`;

// 2. SİTE LAYOUT (app/(site)/layout.tsx) - CSS veya HTML YOK
const siteLayoutContent = `import { AiAssistant } from '@/components/ai/ai-assistant'
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
`;

// 3. ÇIPLAK LAYOUT (app/(bare)/layout.tsx) - CSS veya HTML YOK
const bareLayoutContent = `import { MusicMiniPlayer } from '@/components/music/music-mini-player'
import { MusicPanel } from '@/components/music/music-panel'

export default function BareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MusicMiniPlayer className="bottom-6 left-3 md:left-6" />
      <MusicPanel />
    </>
  )
}
`;

function write(filePath, content) {
  const fullPath = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Başarıyla düzeltildi: ${filePath}`);
}

console.log("🚀 Dosyalar düzeltiliyor...");
write('app/layout.tsx', rootLayoutContent);
write('app/(site)/layout.tsx', siteLayoutContent);
write('app/(bare)/layout.tsx', bareLayoutContent);

// 4. ÖNBELLEK TEMİZLİĞİ (En Önemli Kısım)
const nextDir = path.join(ROOT, '.next');
if (fs.existsSync(nextDir)) {
  console.log("🧹 .next önbelleği temizleniyor (Turbopack hatasını çözmek için)...");
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("✅ .next klasörü tamamen silindi.");
}

const nodeCache = path.join(ROOT, 'node_modules', '.cache');
if (fs.existsSync(nodeCache)) {
  fs.rmSync(nodeCache, { recursive: true, force: true });
  console.log("✅ node_modules/.cache temizlendi.");
}

console.log("\n🎉 Tüm dosyalar düzeltildi ve önbellek temizlendi!");
console.log("👉 Şimdi terminale 'pnpm dev' yazarak sunucuyu başlatabilirsin.");