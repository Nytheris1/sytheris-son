import { getFilmCast } from '@/lib/people'
import { CastCredits } from '@/components/cine/cast-credits'

export async function FilmCast({ title, year, director }: { title: string; year: number | null; director: string }) {
  const cast = await getFilmCast(title, year, director)
  if (!cast.length) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Bu film için oyuncu kadrosu bilgisi bulunamadı.</p>
  }
  return <CastCredits people={cast.map((c) => ({ href: `/oyuncu/${c.id}`, name: c.name, character: c.character, image: c.image }))} />
}
