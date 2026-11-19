import { MusicMiniPlayer } from '@/components/music/music-mini-player'
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
