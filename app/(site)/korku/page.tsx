import type { Metadata } from 'next'
import { HORROR_FILMS } from '@/lib/horror'
import { getViewer } from '@/lib/viewer'
import { HorrorCinema, type CinemaFilm } from '@/components/horror/horror-cinema'

export const metadata: Metadata = {
  title: 'Korku Filmleri',
  description: 'Sytheris+ üyelerine özel, özenle seçilmiş kısa korku filmleri. Işıkları kapat, sesi aç.',
}

export default async function HorrorPage() {
  const viewer = await getViewer().catch(() => null)
  const unlocked = Boolean(viewer && viewer.header.tier !== 'free')
  // Non-members get the programme but never the video ids.
  const films: CinemaFilm[] = HORROR_FILMS.map(({ youtubeId, ...meta }) => (unlocked ? { ...meta, youtubeId } : meta))

  return <HorrorCinema films={films} unlocked={unlocked} loggedIn={Boolean(viewer)} />
}
