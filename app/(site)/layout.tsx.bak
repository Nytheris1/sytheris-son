import { AiAssistant } from '@/components/ai/ai-assistant'
import { MusicMiniPlayer } from '@/components/music/music-mini-player'
import { MusicPanel } from '@/components/music/music-panel'
import { AnnouncementBar } from '@/components/shell/announcement-bar'
import { Intro } from '@/components/shell/intro'
import { MobileNav } from '@/components/shell/mobile-nav'
import { SecretGate } from '@/components/shell/secret-gate'
import { SiteFooter } from '@/components/shell/site-footer'
import { SiteHeader } from '@/components/shell/site-header'
import { getIntroCovers } from '@/lib/anilist'
import { getSettings } from '@/lib/site'
import { getViewer } from '@/lib/viewer'
import { getContentMode } from '@/lib/content-mode'
import { getTopFilms } from '@/lib/films'

async function introArt(mode: 'anime' | 'film') {
  if (mode === 'anime') return { covers: await getIntroCovers(), keyart: '/intro/keyart.webp' }
  const films = (await getTopFilms(30)).filter((f) => f.poster)
  return { covers: films.slice(1, 8).map((f) => f.poster), keyart: films[0]?.posterLg ?? '/intro/keyart.webp' }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const mode = await getContentMode()
  const [settings, viewer, art] = await Promise.all([getSettings(), getViewer().catch(() => null), introArt(mode)])

  return (
    <>
      <Intro covers={art.covers} keyart={art.keyart} mode={mode} enabled={settings.introEnabled} />
      <AnnouncementBar text={settings.announcement} tone={settings.announcementTone} />
      <SiteHeader user={viewer?.header ?? null} mode={mode} />
      <main id="main" className="min-h-[70dvh]">
        {children}
      </main>
      <SiteFooter mode={mode} />
      <MobileNav mode={mode} />
      {settings.aiEnabled && <AiAssistant />}
      <MusicMiniPlayer className="bottom-40 left-3 md:bottom-6 md:left-6" />
      <MusicPanel />
      <SecretGate />
    </>
  )
}
