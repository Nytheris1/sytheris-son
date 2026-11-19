import { Anton, Bangers, Cinzel, Cinzel_Decorative, Dela_Gothic_One, Kaushan_Script, Knewave, Mochiy_Pop_One, Monoton, Orbitron, Racing_Sans_One, Special_Elite, UnifrakturMaguntia } from 'next/font/google'

const action = Anton({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const fantasy = Cinzel({ weight: ['700', '900'], subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const supernatural = Cinzel_Decorative({ weight: ['700'], subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const horror = UnifrakturMaguntia({ weight: '400', subsets: ['latin'], preload: false, display: 'swap' })
const scifi = Orbitron({ weight: ['700', '900'], subsets: ['latin'], preload: false, display: 'swap' })
const romance = Kaushan_Script({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const comedy = Mochiy_Pop_One({ weight: '400', subsets: ['latin'], preload: false, display: 'swap' })
const mystery = Special_Elite({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const music = Monoton({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const sports = Racing_Sans_One({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const brush = Knewave({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const shounen = Bangers({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })
const classic = Dela_Gothic_One({ weight: '400', subsets: ['latin', 'latin-ext'], preload: false, display: 'swap' })

export type TitleStyle = 'action' | 'fantasy' | 'supernatural' | 'horror' | 'scifi' | 'romance' | 'comedy' | 'mystery' | 'music' | 'sports' | 'classic' | 'brush' | 'shounen'

export const TITLE_STYLES: Record<TitleStyle, { font: string; effect: string; label: string }> = {
  action: { font: action.className, effect: 'sy-title-action', label: 'Shounen darbesi' },
  fantasy: { font: fantasy.className, effect: 'sy-title-fantasy', label: 'Kadim altın' },
  supernatural: { font: supernatural.className, effect: 'sy-title-fantasy', label: 'Mühürlü yazıt' },
  horror: { font: horror.className, effect: 'sy-title-horror', label: 'Lanetli gotik' },
  scifi: { font: scifi.className, effect: 'sy-title-scifi', label: 'Neon siber' },
  romance: { font: romance.className, effect: 'sy-title-romance', label: 'Sakura imza' },
  comedy: { font: comedy.className, effect: 'sy-title-comedy', label: 'Pop baskı' },
  mystery: { font: mystery.className, effect: 'sy-title-mystery', label: 'Dosya daktilosu' },
  music: { font: music.className, effect: 'sy-title-music', label: 'Sahne neonu' },
  sports: { font: sports.className, effect: 'sy-title-sports', label: 'Hız çizgisi' },
  classic: { font: classic.className, effect: 'sy-title-classic', label: 'Anime afişi' },
  brush: { font: brush.className, effect: 'sy-title-brush', label: 'Fırça darbesi' },
  shounen: { font: shounen.className, effect: 'sy-title-shounen', label: 'Manga kapağı' },
}

const ORDER: [TitleStyle, string[]][] = [
  ['horror', ['Horror']],
  ['music', ['Music']],
  ['scifi', ['Mecha', 'Sci-Fi']],
  ['sports', ['Sports']],
  ['mystery', ['Mystery', 'Psychological', 'Thriller']],
  ['romance', ['Romance', 'Mahou Shoujo']],
  ['comedy', ['Comedy', 'Slice of Life']],
  ['fantasy', ['Fantasy', 'Adventure']],
  ['supernatural', ['Supernatural']],
  ['action', ['Action']],
]

const COMBOS: [TitleStyle, string[]][] = [
  ['shounen', ['Action', 'Comedy']],
  ['brush', ['Action', 'Supernatural']],
]

const TAG_HINTS: [TitleStyle, string[]][] = [
  ['brush', ['Samurai', 'Demons', 'Curses', 'Swordplay', 'Ninja', 'Yokai']],
  ['scifi', ['Cyberpunk', 'Space', 'Virtual World', 'Super Robot', 'Real Robot']],
  ['horror', ['Gore', 'Vampire', 'Zombie']],
  ['fantasy', ['Isekai', 'Magic', 'Dragons', 'Kingdom Management', 'Mythology']],
  ['comedy', ['Iyashikei', 'Parody', 'Cute Girls Doing Cute Things']],
]

export function titleStyleFor(genres: string[] = [], tags: string[] = []): TitleStyle {
  const topTags = tags.slice(0, 5)
  for (const [style, hints] of TAG_HINTS) if (topTags.some((t) => hints.includes(t))) return style
  for (const [style, list] of COMBOS) if (list.every((g) => genres.includes(g)) && !genres.includes('Horror')) return style
  for (const [style, list] of ORDER) if (genres.some((g) => list.includes(g))) return style
  return 'classic'
}
