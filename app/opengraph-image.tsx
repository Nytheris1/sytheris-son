import { ImageResponse } from 'next/og'
import { getIntroCovers } from '@/lib/anilist'
import { loadGoogleFont } from '@/lib/og'

export const alt = 'SYTHERIS — Anime Keşif Platformu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  const [covers, bold, serif] = await Promise.all([getIntroCovers(), loadGoogleFont('Bricolage Grotesque', 700), loadGoogleFont('Instrument Serif', 400, 'italic')])
  const fonts = [
    ...(bold ? [{ name: 'Bricolage', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(serif ? [{ name: 'Instrument', data: serif, weight: 400 as const, style: 'italic' as const }] : []),
  ]
  const grid = covers.slice(0, 18)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#07100c', fontFamily: 'Bricolage' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, opacity: 0.45, transform: 'rotate(-8deg) scale(1.3)' }}>
          {grid.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" width={180} height={260} style={{ objectFit: 'cover', borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(90deg, #07100c 0%, rgba(7,16,12,0.85) 55%, rgba(7,16,12,0.3) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px', color: '#f4f7f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, letterSpacing: 8, color: '#10d27f' }}>
            <div style={{ width: 48, height: 2, background: '#10d27f' }} />
            ANİME KEŞİF PLATFORMU
          </div>
          <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -6, lineHeight: 1, marginTop: 20 }}>SYTHERIS</div>
          <div style={{ display: 'flex', fontSize: 52, marginTop: 16, gap: 14 }}>
            <span>Bir sonraki favori animen</span>
            <span style={{ fontFamily: 'Instrument', fontStyle: 'italic', color: '#10d27f' }}>burada.</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 40, fontSize: 22, color: 'rgba(244,247,245,0.7)' }}>
            {['Türkiye Top 10', 'Fragmanlar', 'Altyazılı izle', 'Sytheris AI'].map((t) => (
              <div key={t} style={{ display: 'flex', border: '1px solid rgba(244,247,245,0.25)', borderRadius: 999, padding: '10px 22px' }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  )
}
