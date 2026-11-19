import { ImageResponse } from 'next/og'
import { getAnimeMeta } from '@/lib/anilist'
import { formatTr, genreTr, pickTitle, splitTitle } from '@/lib/format'
import { loadGoogleFont } from '@/lib/og'

export const alt = 'Anime detayları — SYTHERIS'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [media, bold, serif] = await Promise.all([getAnimeMeta(Number(id)), loadGoogleFont('Bricolage Grotesque', 700), loadGoogleFont('Instrument Serif', 400, 'italic')])
  const fonts = [
    ...(bold ? [{ name: 'Bricolage', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(serif ? [{ name: 'Instrument', data: serif, weight: 400 as const, style: 'italic' as const }] : []),
  ]
  const title = media ? pickTitle(media.title) : 'SYTHERIS'
  const { head, tail } = splitTitle(title)
  const bg = media?.trailer?.site === 'youtube' ? `https://i.ytimg.com/vi/${media.trailer.id}/hqdefault.jpg` : media?.bannerImage || media?.coverImage.extraLarge
  const accent = media?.coverImage.color || '#10d27f'
  const fontSize = title.length > 40 ? 58 : title.length > 22 ? 72 : 92

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#07100c', fontFamily: 'Bricolage', color: '#f4f7f5' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bg && <img src={bg} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, #07100c 0%, rgba(7,16,12,0.92) 50%, rgba(7,16,12,0.4) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 56, padding: '0 72px', width: '100%' }}>
          {media?.coverImage.extraLarge && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.coverImage.extraLarge} alt="" width={320} height={460} style={{ borderRadius: 28, objectFit: 'cover', boxShadow: `0 30px 80px ${accent}66` }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 20, letterSpacing: 6, color: '#10d27f' }}>
              <div style={{ width: 40, height: 2, background: '#10d27f' }} />
              {[media?.seasonYear, formatTr(media?.format)].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontSize, fontWeight: 700, letterSpacing: -2, lineHeight: 1.02, marginTop: 18, gap: 18 }}>
              {head && <span>{head}</span>}
              <span style={{ fontFamily: 'Instrument', fontStyle: 'italic', fontWeight: 400, color: '#10d27f' }}>{tail}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, fontSize: 22 }}>
              {media?.averageScore ? <div style={{ display: 'flex', background: '#10d27f', color: '#07100c', borderRadius: 999, padding: '8px 20px', fontWeight: 700 }}>{media.averageScore}%</div> : null}
              {(media?.genres ?? []).slice(0, 3).map((g) => (
                <div key={g} style={{ display: 'flex', border: '1px solid rgba(244,247,245,0.3)', borderRadius: 999, padding: '8px 20px' }}>
                  {genreTr(g)}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 48, fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>SYTHERIS</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  )
}
