import { AiAssistant } from '@/components/ai/ai-assistant'
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
