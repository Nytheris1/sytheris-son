import type { MediaTitle } from './anilist-types'

export function pickTitle(t?: MediaTitle | null) {
  if (!t) return 'Bilinmeyen'
  return t.english || t.romaji || t.userPreferred || t.native || 'Bilinmeyen'
}

export function splitTitle(title: string) {
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return { head: '', tail: title }
  const tail = words.pop() as string
  return { head: words.join(' '), tail }
}

export function stripHtml(html?: string | null) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/~!([\s\S]*?)!~/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const GENRES: Record<string, string> = {
  Action: 'Aksiyon',
  Adventure: 'Macera',
  Comedy: 'Komedi',
  Drama: 'Dram',
  Ecchi: 'Ecchi',
  Fantasy: 'Fantastik',
  Horror: 'Korku',
  'Mahou Shoujo': 'Büyülü Kız',
  Mecha: 'Mecha',
  Music: 'Müzik',
  Mystery: 'Gizem',
  Psychological: 'Psikolojik',
  Romance: 'Romantik',
  'Sci-Fi': 'Bilim Kurgu',
  'Slice of Life': 'Günlük Yaşam',
  Sports: 'Spor',
  Supernatural: 'Doğaüstü',
  Thriller: 'Gerilim',
}

export const GENRE_LIST = Object.keys(GENRES).filter((g) => g !== 'Ecchi')

export function genreTr(g: string) {
  return GENRES[g] ?? g
}

const FORMATS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Kısa',
  MOVIE: 'Film',
  SPECIAL: 'Özel',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Müzik',
}
export function formatTr(f?: string | null) {
  return f ? (FORMATS[f] ?? f) : ''
}

const STATUS: Record<string, string> = {
  FINISHED: 'Tamamlandı',
  RELEASING: 'Yayında',
  NOT_YET_RELEASED: 'Yakında',
  CANCELLED: 'İptal',
  HIATUS: 'Ara verildi',
}
export function statusTr(s?: string | null) {
  return s ? (STATUS[s] ?? s) : ''
}

const SEASONS: Record<string, string> = {
  WINTER: 'Kış',
  SPRING: 'İlkbahar',
  SUMMER: 'Yaz',
  FALL: 'Sonbahar',
}
export function seasonTr(s?: string | null) {
  return s ? (SEASONS[s] ?? s) : ''
}

const ROLES: Record<string, string> = {
  MAIN: 'Ana karakter',
  SUPPORTING: 'Yan karakter',
  BACKGROUND: 'Arka plan',
}
export function roleTr(r?: string | null) {
  return r ? (ROLES[r] ?? r) : ''
}

const RELATIONS: Record<string, string> = {
  SEQUEL: 'Devam',
  PREQUEL: 'Öncesi',
  SIDE_STORY: 'Yan hikâye',
  PARENT: 'Ana seri',
  SPIN_OFF: 'Spin-off',
  ALTERNATIVE: 'Alternatif',
  ADAPTATION: 'Uyarlama',
  CHARACTER: 'Karakter',
  SUMMARY: 'Özet',
  OTHER: 'Diğer',
  SOURCE: 'Kaynak',
  COMPILATION: 'Derleme',
  CONTAINS: 'İçerir',
}
export function relationTr(r?: string | null) {
  return r ? (RELATIONS[r] ?? r) : ''
}

export function currentSeason(date = new Date()) {
  const m = date.getMonth()
  const year = date.getFullYear()
  if (m <= 2) return { season: 'WINTER', year }
  if (m <= 5) return { season: 'SPRING', year }
  if (m <= 8) return { season: 'SUMMER', year }
  return { season: 'FALL', year }
}

export function timeUntil(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}g ${h}s`
  if (h > 0) return `${h}s ${m}dk`
  return `${m}dk`
}

export function fuzzyDate(d?: { year?: number | null; month?: number | null; day?: number | null } | null) {
  if (!d || !d.year) return null
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return [d.day, d.month ? months[d.month - 1] : null, d.year].filter(Boolean).join(' ')
}

export function compact(n?: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
