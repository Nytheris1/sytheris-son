/** Anime-specific discovery vocabulary mapped to AniList tags. Every tag below is verified to exist on AniList. */

export type Trope = { tag: string; label: string }
export type TropeGroup = { id: string; label: string; items: Trope[] }

export const TROPE_GROUPS: TropeGroup[] = [
  {
    id: 'world',
    label: 'Dünya',
    items: [
      { tag: 'Isekai', label: 'İsekai' },
      { tag: 'Reincarnation', label: 'Reenkarnasyon' },
      { tag: 'Virtual World', label: 'Sanal dünya' },
      { tag: 'Video Games', label: 'Oyun dünyası' },
      { tag: 'Dungeon', label: 'Zindan' },
      { tag: 'Kingdom Management', label: 'Krallık yönetimi' },
      { tag: 'Post-Apocalyptic', label: 'Kıyamet sonrası' },
      { tag: 'Cyberpunk', label: 'Siberpunk' },
      { tag: 'Space', label: 'Uzay' },
      { tag: 'Urban Fantasy', label: 'Şehir fantastiği' },
    ],
  },
  {
    id: 'heart',
    label: 'Kalp',
    items: [
      { tag: 'Female Harem', label: 'Harem' },
      { tag: 'Male Harem', label: 'Ters harem' },
      { tag: 'Love Triangle', label: 'Aşk üçgeni' },
      { tag: 'Tsundere', label: 'Tsundere' },
      { tag: 'Yandere', label: 'Yandere' },
      { tag: 'Villainess', label: 'Kötü kız' },
      { tag: 'Found Family', label: 'Seçilmiş aile' },
      { tag: 'Coming of Age', label: 'Büyüme hikâyesi' },
    ],
  },
  {
    id: 'power',
    label: 'Güç',
    items: [
      { tag: 'Super Power', label: 'Süper güç' },
      { tag: 'Magic', label: 'Büyü' },
      { tag: 'Martial Arts', label: 'Dövüş sanatları' },
      { tag: 'Swordplay', label: 'Kılıç' },
      { tag: 'Samurai', label: 'Samuray' },
      { tag: 'Ninja', label: 'Ninja' },
      { tag: 'Demons', label: 'İblisler' },
      { tag: 'Vampire', label: 'Vampir' },
      { tag: 'Gods', label: 'Tanrılar' },
      { tag: 'Dragons', label: 'Ejderhalar' },
      { tag: 'Anti-Hero', label: 'Anti-kahraman' },
    ],
  },
  {
    id: 'vibe',
    label: 'Atmosfer',
    items: [
      { tag: 'Iyashikei', label: 'İyashikei' },
      { tag: 'Cute Girls Doing Cute Things', label: 'Tatlı günlük' },
      { tag: 'School', label: 'Okul' },
      { tag: 'Idol', label: 'İdol' },
      { tag: 'Parody', label: 'Parodi' },
      { tag: 'Chuunibyou', label: 'Chuunibyou' },
      { tag: 'Tragedy', label: 'Trajedi' },
      { tag: 'Revenge', label: 'İntikam' },
      { tag: 'Survival', label: 'Hayatta kalma' },
      { tag: 'Death Game', label: 'Ölüm oyunu' },
      { tag: 'Time Manipulation', label: 'Zaman' },
      { tag: 'Body Swapping', label: 'Beden değişimi' },
      { tag: 'Detective', label: 'Dedektif' },
      { tag: 'Military', label: 'Askeri' },
      { tag: 'Mythology', label: 'Mitoloji' },
    ],
  },
]

export const DEMOGRAPHICS: Trope[] = [
  { tag: 'Shounen', label: 'Shōnen' },
  { tag: 'Seinen', label: 'Seinen' },
  { tag: 'Shoujo', label: 'Shōjo' },
  { tag: 'Josei', label: 'Josei' },
]

export const TROPE_LABEL: Record<string, string> = Object.fromEntries([...TROPE_GROUPS.flatMap((g) => g.items), ...DEMOGRAPHICS].map((t) => [t.tag, t.label]))

export type Mood = { id: string; label: string; line: string; genres?: string[]; tags?: string[] }

export const MOODS: Mood[] = [
  { id: 'chill', label: 'Kafa dinlemek istiyorum', line: 'Bir fincan çay, sıcak bir battaniye ve huzur.', tags: ['Iyashikei'] },
  { id: 'cry', label: 'Ağlamaya hazırım', line: 'Mendilleri hazırla, bu kart kalbine dokunacak.', genres: ['Drama'], tags: ['Tragedy'] },
  { id: 'hype', label: 'Adrenalin lazım', line: 'Kemerleri bağla, ekrandan kıvılcım çıkacak!', genres: ['Action'] },
  { id: 'escape', label: 'Başka dünyaya kaçayım', line: 'Kamyon-kun hazır. Yeni dünyana hoş geldin.', tags: ['Isekai'] },
  { id: 'love', label: 'Kalbim çarpsın', line: 'Kiraz çiçekleri altında bir itiraf seni bekliyor.', genres: ['Romance'] },
  { id: 'brain', label: 'Beynim yansın', line: 'Her şeyi sorgulayacağın bir gece olacak.', genres: ['Psychological'] },
  { id: 'laugh', label: 'Gülmekten ölmek', line: 'Karın kasların için önceden özür dilerim.', genres: ['Comedy'] },
  { id: 'dark', label: 'Karanlık taraf', line: 'Işıkları kapat. Arkana bakmayı unutma.', genres: ['Horror'] },
]

export const ERAS: { id: string; label: string; from: number; to: number }[] = [
  { id: 'retro', label: '90’lar ve öncesi', from: 19000000, to: 20000000 },
  { id: '2000s', label: '2000’ler', from: 20000000, to: 20100000 },
  { id: '2010s', label: '2010’lar', from: 20100000, to: 20200000 },
  { id: 'modern', label: '2020+', from: 20200000, to: 21000000 },
]

export const LENGTHS: { id: 'short' | 'mid' | 'long'; label: string }[] = [
  { id: 'short', label: 'Kısa (≤13)' },
  { id: 'mid', label: 'Orta (14–30)' },
  { id: 'long', label: 'Uzun (30+)' },
]
