import type { CSSProperties } from 'react'

export type Tier = 'free' | 'plus' | 'ultra'
export type Role = 'user' | 'moderator' | 'admin'
export type Premium = { tier: Exclude<Tier, 'free'>; since: number; until: number | null } | null

export const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, ultra: 2 }
export const TIER_LABEL: Record<Tier, string> = { free: 'Ücretsiz', plus: 'Sytheris+', ultra: 'Ultra' }

export function activeTier(p?: Premium | null): Tier {
  if (!p) return 'free'
  if (p.until && p.until < Date.now()) return 'free'
  return p.tier
}

export function hasTier(p: Premium | null | undefined, need: Tier) {
  return TIER_RANK[activeTier(p)] >= TIER_RANK[need]
}

export const PLANS: { id: Tier; name: string; price: string; period: string; tagline: string; perks: string[] }[] = [
  {
    id: 'free',
    name: 'Gezgin',
    price: '₺0',
    period: 'sonsuza dek',
    tagline: 'Keşfetmeye başlamak için her şey.',
    perks: ['Sınırsız keşif ve takvim', '5 özel kütüphane listesi', 'Yorum ve favoriler', 'Kızıl Kurdele kozmetik seti'],
  },
  {
    id: 'plus',
    name: 'Sytheris+',
    price: '₺49',
    period: 'aylık',
    tagline: 'Profilini sahneye taşı.',
    perks: [
      'Gece Sineması: 160+ kısa korku filmi',
      'Sytheris+ Galeri ve Çizim Atölyesi',
      'Özel tema stüdyosu: kendi rengin, kendi adın',
      'Hareketli avatar ve afiş (GIF / MP4)',
      'Varaklı yorum mürekkepleri',
      '25 özel liste',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: '₺89',
    period: 'aylık',
    tagline: 'Koleksiyonun zirvesi.',
    perks: ['Plus’taki her şey', 'Kutup Işığı ve İnci mürekkepleri', 'Ultra rozeti ve parıltı', 'Sınırsız liste'],
  },
]

export const LIST_LIMIT: Record<Tier, number> = { free: 5, plus: 25, ultra: 200 }

/* ------------------------------------------------------------- Cosmetics
 * Tek bir set var: "Kızıl Kurdele". Gül altını çift halka, kızıl kurdeleler,
 * yakut taşlar ve inci sarkıtlar. Avatar çerçevesi, afiş çerçevesi ve isim
 * plakası aynı dili konuşur. Çizimler components/membership/ribbon-ornaments.tsx
 * içinde SVG olarak yapılır. Eski kayıtlı değerler (halo, neon vb.) güvenle "yok"a düşer.
 */

export type FrameId = 'none' | 'ribbon'

export const FRAMES: { id: FrameId; name: string; tier: Tier; description: string }[] = [
  { id: 'none', name: 'Sade', tier: 'free', description: 'Çerçevesiz, temiz görünüm.' },
  { id: 'ribbon', name: 'Kızıl Kurdele', tier: 'free', description: 'Gül altını çift halka, kızıl kurdele, yakut taç ve inci sarkıt.' },
]

export function resolveFrame(id?: string | null): FrameId {
  return id === 'ribbon' ? 'ribbon' : 'none'
}

/** Legacy full-background presets. Kept only so old stored values parse; they render nothing. */
export type BannerPreset = 'none' | 'aurora' | 'stars' | 'petals' | 'grid' | 'waves' | 'sunset' | 'ink' | 'galaxy' | 'neon' | 'rain'

/** Frame drawn around the user's own banner image or video. It never replaces the image. */
export type BannerOverlay = 'none' | 'ribbon'

export const BANNER_OVERLAYS: { id: BannerOverlay; name: string; tier: Tier; description: string }[] = [
  { id: 'none', name: 'Çerçevesiz', tier: 'free', description: 'Afiş olduğu gibi görünür.' },
  { id: 'ribbon', name: 'Kızıl Kurdele', tier: 'free', description: 'Gül altını pervaz, köşelerde kurdele ve sarkan yakutlar.' },
]

export function resolveBannerOverlay(u: { bannerOverlay?: string | null; bannerPreset?: string | null }): BannerOverlay {
  return u.bannerOverlay === 'ribbon' ? 'ribbon' : 'none'
}

/** Profile effects were retired with the old cosmetics; the type stays so stored rows still parse. */
export type ProfileEffect = 'none'

/** Discord-style plate drawn behind a user's name in comments, menus and on the profile. */
export type Nameplate = 'none' | 'ribbon'

export const NAMEPLATES: { id: Nameplate; name: string; tier: Tier; description: string }[] = [
  { id: 'none', name: 'Plakasız', tier: 'free', description: 'İsmin sade görünür.' },
  { id: 'ribbon', name: 'Kızıl Kurdele', tier: 'free', description: 'Allık pembesi zemin, gül altını kenar ve uçlarda yakut taşlar.' },
]

export function resolveNameplate(id?: string | null): Nameplate {
  return id === 'ribbon' ? 'ribbon' : 'none'
}

/** Name styles were retired with the old cosmetics; stored values render as plain text. */
export type NameStyle = 'default'

export function nameStyleClass(_id?: string | null) {
  return ''
}

/* ---------------------------------------------------------- Comment inks
 * Yorum rengi artık balonu değil, yazının kendisini boyar. Her mürekkep iki
 * tonlu bir gradyan; bazıları üzerinden ışık geçen "varak" efektli.
 */
export type CommentColor =
  | 'default'
  | 'theme'
  | 'crimson'
  | 'rosegold'
  | 'sakura'
  | 'dusk'
  | 'ocean'
  | 'mint'
  | 'lavender'
  | 'ember'
  | 'gilded'
  | 'aurora'
  | 'pearl'

export type CommentInk = { id: CommentColor; name: string; tier: Tier; from: string | null; to: string | null; sheen?: boolean; description: string }

export const COMMENT_COLORS: CommentInk[] = [
  { id: 'default', name: 'Mürekkep', tier: 'free', from: null, to: null, description: 'Sitenin yazı rengi.' },
  { id: 'theme', name: 'Tema', tier: 'free', from: 'var(--ink)', to: 'color-mix(in oklch, var(--ink) 60%, var(--foreground))', description: 'Seçtiğin tema renginde.' },
  { id: 'crimson', name: 'Kızıl Kurdele', tier: 'free', from: 'oklch(0.62 0.22 22)', to: 'oklch(0.5 0.2 10)', sheen: true, description: 'Kurdele setinin yakut kırmızısı.' },
  { id: 'rosegold', name: 'Gül Altını', tier: 'free', from: 'oklch(0.72 0.1 50)', to: 'oklch(0.6 0.12 20)', sheen: true, description: 'Pembe altın varak.' },
  { id: 'sakura', name: 'Sakura', tier: 'free', from: 'oklch(0.7 0.16 355)', to: 'oklch(0.62 0.18 330)', description: 'Kiraz çiçeği pembesi.' },
  { id: 'dusk', name: 'Alacakaranlık', tier: 'free', from: 'oklch(0.66 0.17 40)', to: 'oklch(0.55 0.2 330)', description: 'Turuncudan mora akan gün batımı.' },
  { id: 'ocean', name: 'Derin Deniz', tier: 'free', from: 'oklch(0.62 0.13 230)', to: 'oklch(0.55 0.14 265)', description: 'Lacivertten turkuaza.' },
  { id: 'mint', name: 'Nane', tier: 'free', from: 'oklch(0.66 0.13 165)', to: 'oklch(0.58 0.12 195)', description: 'Serin yeşil ve camgöbeği.' },
  { id: 'lavender', name: 'Lavanta', tier: 'free', from: 'oklch(0.64 0.14 295)', to: 'oklch(0.56 0.16 270)', description: 'Yumuşak mor.' },
  { id: 'ember', name: 'Kor', tier: 'plus', from: 'oklch(0.7 0.19 55)', to: 'oklch(0.58 0.23 28)', sheen: true, description: 'Alevden kopmuş turuncu.' },
  { id: 'gilded', name: 'Altın Varak', tier: 'plus', from: 'oklch(0.78 0.14 85)', to: 'oklch(0.6 0.12 65)', sheen: true, description: 'Üzerinden ışık geçen dövme altın.' },
  { id: 'aurora', name: 'Kutup Işığı', tier: 'ultra', from: 'oklch(0.7 0.14 175)', to: 'oklch(0.6 0.2 300)', sheen: true, description: 'Turkuazdan mora dalgalanan perde.' },
  { id: 'pearl', name: 'İnci', tier: 'ultra', from: 'oklch(0.7 0.06 260)', to: 'oklch(0.66 0.08 340)', sheen: true, description: 'Sedef parıltılı, ışığa göre renk değiştirir.' },
]

export function commentInk(id?: string | null): CommentInk | null {
  const ink = COMMENT_COLORS.find((c) => c.id === id)
  return ink && ink.from ? ink : null
}

/** CSS custom properties for `.sy-ink`; empty when the user writes in the default colour. */
export function commentInkStyle(id?: string | null): CSSProperties | undefined {
  const ink = commentInk(id)
  if (!ink) return undefined
  return { '--ink-a': ink.from, '--ink-b': ink.to } as CSSProperties
}

export function commentInkClass(id?: string | null) {
  const ink = commentInk(id)
  if (!ink) return ''
  return ink.sheen ? 'sy-ink sy-ink-sheen' : 'sy-ink'
}

/** @deprecated kept for older call sites. */
export function commentColorValue(id?: string | null) {
  return commentInk(id)?.from ?? null
}

/* ------------------------------------------------------------------ Badges */

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export const RARITY: Record<BadgeRarity, { label: string; rank: number }> = {
  common: { label: 'Yaygın', rank: 0 },
  rare: { label: 'Nadir', rank: 1 },
  epic: { label: 'Destansı', rank: 2 },
  legendary: { label: 'Efsanevi', rank: 3 },
  mythic: { label: 'Mitik', rank: 4 },
}

export type BadgeId =
  | 'founder'
  | 'staff'
  | 'moderator'
  | 'plus'
  | 'ultra'
  | 'early'
  | 'verified'
  | 'otaku'
  | 'critic'
  | 'collector'
  | 'sakura'
  | 'night'
  | 'firstStep'
  | 'curator'
  | 'marathon'
  | 'veteran'
  | 'beta'
  | 'isekai'
  | 'mecha'
  | 'idol'
  | 'samurai'
  | 'senpai'
  | 'nakama'
  | 'spirit'
  | 'bard'
  | 'legend'
  | 'syraHeart'
  | 'midnight'
  | 'streak7'
  | 'streak30'
  | 'mangaka'
  | 'artist'
  | 'cosplay'
  | 'translator'
  | 'subber'
  | 'bughunter'
  | 'partner'
  | 'supporter'
  | 'champion'
  | 'halloween'
  | 'newyear'
  | 'tsundere'
  | 'gamer'
  | 'bookworm'
  | 'popcorn'
  | 'kawaii'
  | 'cinephile'
  | 'eternal'
  | 'masterpiece'
  | 'shogun'
  | 'painter'
  | 'nightWatch'
  | 'oracle'
  | 'speedrun'
  | 'matcha'
  | 'sketcher'
  | 'shrine'
  | 'spiritGarden'
  | 'sensei'
  | 'ramen'
  | 'neko'
  | 'shonen'
  | 'shojo'
  | 'dreamer'
  | 'stargazer'
  | 'cineLegend'
  | 'goldenReel'
  | 'awardNight'
  | 'gift'
  | 'nightShift'
  | 'seriesBinger'
  | 'directorsCut'
  | 'plotTwist'
  | 'screamQueen'
  | 'criticChoice'
  | 'puzzleMaster'
  | 'lucky'
  | 'projectionist'
  | 'ticketStub'
  | 'cliffhanger'
  | 'spoilerShield'
  | 'glasses3d'
  | 'finalGirl'
  | 'pinCollector'
  | 'galleryCurator'
  | 'aperture'
  | 'snowfall'
  | 'explorer'
  | 'dj'
  | 'frontRow'
  | 'detective'
  | 'spaceCadet'
  | 'cowboy'
  | 'documentarian'
  | 'creditRoller'
  | 'moodboard'
  | 'photographer'
  | 'earlyBird'
  | 'wizard'
  | 'poet'
  | 'heartbreak'
  | 'herald'

export const BADGES: Record<BadgeId, { name: string; description: string; hue: number; rarity: BadgeRarity; auto?: boolean }> = {
  legend: { name: 'Efsane', description: 'Sytheris tarihine adını altın harflerle yazdırdı.', hue: 50, rarity: 'mythic' },
  eternal: { name: 'Sönmeyen Alev', description: 'Sytheris’in ilk gününden beri burada; hiç ayrılmadı.', hue: 25, rarity: 'mythic' },
  masterpiece: { name: 'Başyapıt', description: 'Atölye’deki bir çizimi haftanın eseri seçildi.', hue: 85, rarity: 'legendary' },
  shogun: { name: 'Şogun', description: 'Bir topluluk etkinliğine liderlik etti.', hue: 15, rarity: 'legendary' },
  painter: { name: 'Atölye Sanatçısı', description: 'Çizim Atölyesi galerisinde ilk eserini sergiledi.', hue: 330, rarity: 'epic', auto: true },
  nightWatch: { name: 'Gece Bekçisi', description: 'Korku Filmleri’nda on kısa filmi sonuna kadar izledi.', hue: 0, rarity: 'epic' },
  oracle: { name: 'Kâhin', description: 'Bir serinin sonunu herkesten önce tahmin etti.', hue: 275, rarity: 'epic' },
  speedrun: { name: 'Tek Oturuş', description: 'Koca bir sezonu tek günde bitirdi.', hue: 55, rarity: 'epic' },
  matcha: { name: 'Matcha Molası', description: 'Bölüm arasında çayını demlemeden geçmez.', hue: 135, rarity: 'rare' },
  sketcher: { name: 'Eskizci', description: 'Atölye’de beş çizim tamamladı.', hue: 300, rarity: 'rare' },
  shrine: { name: 'Tapınak Müdavimi', description: 'Yayın takvimini her hafta ziyaret eder.', hue: 20, rarity: 'rare' },
  spiritGarden: { name: 'Ruh Bahçesi', description: 'Sakin, dilim-yaşam hikâyelerinin sevdalısı.', hue: 150, rarity: 'rare' },
  sensei: { name: 'Sensei', description: 'Topluluğa rehber yazılar ve öneriler kazandırdı.', hue: 230, rarity: 'rare' },
  ramen: { name: 'Ramen Gecesi', description: 'Gece yarısı bölümü ramensiz izlenmez.', hue: 45, rarity: 'common' },
  neko: { name: 'Neko', description: 'Her animede ilk kediyi o fark eder.', hue: 30, rarity: 'common' },
  shonen: { name: 'Shōnen Ruhu', description: 'Antrenman montajı başlayınca yerinde duramaz.', hue: 10, rarity: 'common' },
  shojo: { name: 'Shōjo Kalbi', description: 'Çiçekli arka planlar ve itiraf sahneleri için yaşar.', hue: 345, rarity: 'common' },
  dreamer: { name: 'Hayalperest', description: 'Bir gün kendi hikâyesini anlatacak.', hue: 205, rarity: 'common' },
  stargazer: { name: 'Yıldız Gözlemcisi', description: 'Uzay operası ve bilim kurgu tutkunu.', hue: 250, rarity: 'common' },
  syraHeart: { name: 'Syra’nın Gözdesi', description: 'Syra’nın bizzat seçtiği nadir ruhlardan.', hue: 350, rarity: 'mythic' },
  founder: { name: 'Kurucu', description: 'Sytheris’in ilk mimarlarından.', hue: 80, rarity: 'legendary' },
  ultra: { name: 'Ultra', description: 'Ultra abonesi.', hue: 300, rarity: 'legendary', auto: true },
  partner: { name: 'Partner', description: 'Resmî Sytheris iş ortağı.', hue: 200, rarity: 'legendary' },
  champion: { name: 'Turnuva Şampiyonu', description: 'Bir topluluk etkinliğini kazandı.', hue: 70, rarity: 'legendary' },
  staff: { name: 'Ekip', description: 'Sytheris ekibinin bir üyesi.', hue: 255, rarity: 'epic' },
  moderator: { name: 'Moderatör', description: 'Topluluğu güvende tutar.', hue: 200, rarity: 'epic', auto: true },
  verified: { name: 'Doğrulanmış', description: 'E-posta adresini kodla doğrulamış hesap.', hue: 230, rarity: 'epic' },
  marathon: { name: 'Maratoncu', description: 'Kütüphanesinde 100+ anime var.', hue: 5, rarity: 'epic', auto: true },
  veteran: { name: 'Kıdemli', description: '1 yıldır Sytheris’te.', hue: 60, rarity: 'epic', auto: true },
  midnight: { name: 'Gece Yarısı Seansı', description: 'Korku Filmleri’nda bir korku filmi izledi.', hue: 20, rarity: 'epic', auto: true },
  streak30: { name: 'Aylık Seri', description: '30 gün üst üste Sytheris’e uğradı.', hue: 140, rarity: 'epic' },
  mangaka: { name: 'Mangaka', description: 'Kendi mangasını çizen yaratıcı.', hue: 20, rarity: 'epic' },
  translator: { name: 'Çevirmen', description: 'Türkçe çeviriye emek veren gönüllü.', hue: 210, rarity: 'epic' },
  bughunter: { name: 'Hata Avcısı', description: 'Bir hatayı bulup ekibe bildirdi.', hue: 130, rarity: 'epic' },
  halloween: { name: 'Cadılar Bayramı ’26', description: '2026 korku gecesi etkinliğine katıldı.', hue: 45, rarity: 'epic' },
  newyear: { name: 'Yeni Yıl ’27', description: '2027’yi Sytheris’te karşıladı.', hue: 95, rarity: 'epic' },
  plus: { name: 'Sytheris+', description: 'Sytheris+ abonesi.', hue: 155, rarity: 'rare', auto: true },
  early: { name: 'Erken Erişim', description: 'İlk 1000 kullanıcı arasında.', hue: 25, rarity: 'rare' },
  otaku: { name: 'Otaku', description: 'Kütüphanesinde 50+ anime var.', hue: 15, rarity: 'rare', auto: true },
  critic: { name: 'Eleştirmen', description: '10+ yorum yazdı.', hue: 45, rarity: 'rare', auto: true },
  collector: { name: 'Koleksiyoncu', description: '5+ özel liste oluşturdu.', hue: 175, rarity: 'rare', auto: true },
  curator: { name: 'Küratör', description: '10+ animeyi favorilerine ekledi.', hue: 330, rarity: 'rare', auto: true },
  sakura: { name: 'Sakura', description: 'Bahar etkinliği katılımcısı.', hue: 355, rarity: 'rare' },
  beta: { name: 'Beta Test', description: 'Yeni özellikleri ilk deneyenlerden.', hue: 190, rarity: 'rare' },
  senpai: { name: 'Senpai', description: 'Yeni gelenlere yol gösteren.', hue: 100, rarity: 'rare' },
  streak7: { name: 'Haftalık Seri', description: '7 gün üst üste Sytheris’e uğradı.', hue: 120, rarity: 'rare' },
  artist: { name: 'Fan Sanatçısı', description: 'Topluluğa fan art kazandırdı.', hue: 320, rarity: 'rare' },
  cosplay: { name: 'Cosplayer', description: 'Sevdiği karaktere hayat veren.', hue: 350, rarity: 'rare' },
  subber: { name: 'Altyazı Ustası', description: 'Siteye altyazı yükledi.', hue: 190, rarity: 'rare' },
  supporter: { name: 'Destekçi', description: 'Sytheris’e gönülden destek oldu.', hue: 10, rarity: 'rare' },
  cinephile: { name: 'Sinefil', description: 'Film ve kısa filmlerin tutkunu.', hue: 260, rarity: 'rare' },
  firstStep: { name: 'İlk Adım', description: 'İlk yorumunu yazdı.', hue: 140, rarity: 'common', auto: true },
  bard: { name: 'OST Ozanı', description: 'Profil müziği hiç susmayan.', hue: 170, rarity: 'common', auto: true },
  night: { name: 'Gece Kuşu', description: 'Gece yarısı maratoncusu.', hue: 270, rarity: 'common' },
  isekai: { name: 'İsekai Gezgini', description: 'Başka dünyalara kapı aralayan.', hue: 210, rarity: 'common' },
  mecha: { name: 'Mecha Pilotu', description: 'Dev robotların sadık pilotu.', hue: 240, rarity: 'common' },
  idol: { name: 'Idol Fanı', description: 'Sahne ışıklarının en ön sırası.', hue: 340, rarity: 'common' },
  samurai: { name: 'Samuray', description: 'Kılıç ve onur yolunda.', hue: 15, rarity: 'common' },
  nakama: { name: 'Nakama', description: 'Topluluğun vazgeçilmez dostu.', hue: 30, rarity: 'common' },
  spirit: { name: 'Ruh Avcısı', description: 'Doğaüstünün peşinde.', hue: 280, rarity: 'common' },
  tsundere: { name: 'Tsundere', description: '“B-bu rozeti senin için almadım!”', hue: 5, rarity: 'common' },
  gamer: { name: 'Oyuncu', description: 'Anime kadar oyunları da sever.', hue: 280, rarity: 'common' },
  bookworm: { name: 'Light Novel Kurdu', description: 'Animesi çıkmadan kitabını okumuştur.', hue: 60, rarity: 'common' },
  popcorn: { name: 'Film Gecesi', description: 'Mısırı hazır, ışıkları kapalı.', hue: 40, rarity: 'common' },
  kawaii: { name: 'Kawaii', description: 'Sevimliliğin resmî temsilcisi.', hue: 350, rarity: 'common' },
  cineLegend: { name: 'Sinema Efsanesi', description: 'Sinema modunda 500 film ve dizi bölümü izledi.', hue: 70, rarity: 'mythic' },
  goldenReel: { name: 'Altın Makara', description: 'Klasikler listesinden 25 filmi sonuna kadar izledi.', hue: 60, rarity: 'legendary' },
  awardNight: { name: 'Ödül Gecesi', description: 'Ödül sezonunda bütün adayları izledi.', hue: 85, rarity: 'legendary' },
  gift: { name: 'Hediye Paketi', description: 'Birine Sytheris+ hediye etti.', hue: 340, rarity: 'legendary' },
  nightShift: { name: 'Gece Seansı', description: 'Gece Sineması’nda 25 kısa korku filmi izledi.', hue: 5, rarity: 'legendary' },
  seriesBinger: { name: 'Dizi Bağımlısı', description: 'Koca bir diziyi bir haftada bitirdi.', hue: 210, rarity: 'epic' },
  directorsCut: { name: 'Yönetmen Kurgusu', description: 'Her filmin uzun versiyonunu tercih eder.', hue: 15, rarity: 'epic' },
  plotTwist: { name: 'Ters Köşe', description: 'Sonunu kimsenin tahmin edemediği bir filmi önerdi.', hue: 290, rarity: 'epic' },
  screamQueen: { name: 'Çığlık Kraliçesi', description: 'Korku filmlerinde bir kez bile gözünü kapatmadı.', hue: 355, rarity: 'epic' },
  criticChoice: { name: 'Eleştirmenin Seçimi', description: 'Yorumu en çok beğenilenler arasına girdi.', hue: 50, rarity: 'epic' },
  puzzleMaster: { name: 'Bilmece Ustası', description: 'Sytheris’in gizli bir köşesini buldu.', hue: 310, rarity: 'epic' },
  lucky: { name: 'Şanslı Zar', description: 'Rastgele öneriden efsanevi bir kart çekti.', hue: 100, rarity: 'epic' },
  projectionist: { name: 'Makinist', description: 'Sinema modunu bir hafta boyunca hiç kapatmadı.', hue: 45, rarity: 'rare' },
  ticketStub: { name: 'Bilet Koçanı', description: 'Rastgele seansın seçtiği filmi sonuna kadar izledi.', hue: 75, rarity: 'rare' },
  cliffhanger: { name: 'Uçurumun Kenarı', description: 'Sezon finalinde nefesi kesildi, yenisini bekliyor.', hue: 190, rarity: 'rare' },
  spoilerShield: { name: 'Spoiler Kalkanı', description: 'Tek bir sürprizi bile bozmadı.', hue: 160, rarity: 'rare' },
  glasses3d: { name: '3D Gözlük', description: 'Gişe rekortmenlerinin ilk seansında yerini alır.', hue: 330, rarity: 'rare' },
  finalGirl: { name: 'Final Girl', description: 'Bütün korku klişelerini ezbere bilir, asla bodruma inmez.', hue: 345, rarity: 'rare' },
  pinCollector: { name: 'Pin Avcısı', description: 'Pinterest’ten on referans topladı.', hue: 0, rarity: 'rare' },
  galleryCurator: { name: 'Galeri Küratörü', description: 'Galerisini kategorilere ayırdı.', hue: 265, rarity: 'rare' },
  aperture: { name: 'Diyafram', description: 'Galerisine video ekleyip onu hareketlendirdi.', hue: 185, rarity: 'rare' },
  snowfall: { name: 'Kış Masalı', description: 'Kış etkinliğine katıldı.', hue: 215, rarity: 'rare' },
  explorer: { name: 'Kâşif', description: 'Keşfet’te yirmi farklı türü denedi.', hue: 145, rarity: 'rare' },
  dj: { name: 'DJ', description: 'Profil çalma listesini yirmi şarkıya çıkardı.', hue: 285, rarity: 'rare' },
  frontRow: { name: 'Ön Sıra', description: 'Sinema modunda ilk fragmanını izledi.', hue: 30, rarity: 'common' },
  detective: { name: 'Dedektif', description: 'Suç dizilerinin vazgeçilmez müdavimi.', hue: 220, rarity: 'common' },
  spaceCadet: { name: 'Uzay Kadeti', description: 'Bilim kurgu filmlerine gönül verdi.', hue: 240, rarity: 'common' },
  cowboy: { name: 'Kovboy', description: 'Toz, güneş ve gün batımında düello.', hue: 40, rarity: 'common' },
  documentarian: { name: 'Belgeselci', description: 'Gerçeğin kurgudan tuhaf olduğuna inanır.', hue: 120, rarity: 'common' },
  creditRoller: { name: 'Jenerik Sabrı', description: 'Jenerik sonu sahnesini asla kaçırmaz.', hue: 180, rarity: 'common' },
  moodboard: { name: 'Moodboard', description: 'Galerisine ilk koleksiyonunu ekledi.', hue: 300, rarity: 'common' },
  photographer: { name: 'Objektif', description: 'Galerisine kendi çektiği bir fotoğrafı yükledi.', hue: 200, rarity: 'common' },
  earlyBird: { name: 'Erkenci', description: 'Sabah altıdan önce bir bölüm izledi.', hue: 65, rarity: 'common' },
  wizard: { name: 'Büyücü', description: 'Fantastik dünyaların daimî sakini.', hue: 275, rarity: 'common' },
  poet: { name: 'Şair', description: 'Yorumlarını dize dize yazar.', hue: 95, rarity: 'common' },
  heartbreak: { name: 'Kırık Kalp', description: 'Sevdiği karakterin vedasını hâlâ atlatamadı.', hue: 0, rarity: 'common' },
  herald: { name: 'Haberci', description: 'Bir arkadaşını Sytheris’e davet etti.', hue: 25, rarity: 'common' },
}

export const BADGE_IDS = (Object.keys(BADGES) as BadgeId[]).sort((a, b) => RARITY[BADGES[b].rarity].rank - RARITY[BADGES[a].rarity].rank)

/** Sorts a user's badges so the rarest ones lead. */
export function sortBadges(ids: BadgeId[]) {
  return ids.filter((id) => BADGES[id]).sort((a, b) => RARITY[BADGES[b].rarity].rank - RARITY[BADGES[a].rarity].rank)
}

export function isAnimatedMedia(url?: string | null) {
  if (!url) return false
  // Uploaded files arrive as data URLs; stills are re-encoded client-side, so only GIF/video are animated.
  if (url.startsWith('data:')) return /^data:(image\/gif|video\/)/i.test(url)
  return /\.(gif|webp|apng|mp4|webm)(\?|$)/i.test(url) || /giphy\.com|tenor\.com/i.test(url)
}

export function isVideoMedia(url?: string | null) {
  if (!url) return false
  if (url.startsWith('data:')) return /^data:video\//i.test(url)
  return /\.(mp4|webm)(\?|$)/i.test(url)
}
