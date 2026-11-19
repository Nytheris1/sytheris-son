/*
 * MASKOT AYARLARI — maskotu değiştirmek için dokunman gereken TEK dosya.
 *
 * En kolay yol: public/mascot/ klasöründeki görselleri AYNI İSİMLERLE kendi görsellerinle değiştir.
 * Farklı isim / format (png, jpg, webp) ya da internet adresi kullanmak istersen aşağıdaki yolları düzenle.
 * Adım adım anlatım ve canlı deneme: sitede /rehber sayfası.
 */

export const MASCOT = {
  /** Sitenin her yerinde geçen maskot adı. */
  name: 'Syra',
  /** Ruh hâline göre görseller. Şeffaf arka planlı, dikey (yaklaşık 3:4) görseller en iyi sonucu verir. */
  images: {
    /** El sallayan, karşılayan hâl — ana sayfa, giriş, tanıtım. */
    wave: '/mascot/syra-wave.webp',
    /** Kaybolmuş / şaşkın — 404 ve hata sayfaları. */
    lost: '/mascot/syra-lost.webp',
    /** Sır veren / göz kırpan — gizli paneller, sürprizler. */
    secret: '/mascot/syra-secret.webp',
    /** Düşünen — boş durumlar, yapay zekâ asistanı. */
    think: '/mascot/syra-think.webp',
    /** Bel üstü portre — tanıtım filmi ve büyük alanlar. */
    portrait: '/mascot/syra-portrait.webp',
    /** Kare yüz kırpımı — avatarlar, yuvarlak rozetler. Kare (1:1) olmalı. */
    avatar: '/mascot/syra-avatar.webp',
  },
  /** Tema renklerine göre giydirilmiş versiyonlar (tanıtım sayfasındaki tema seçici). */
  themes: {
    green: '/mascot/syra-green.webp',
    red: '/mascot/syra-red.webp',
    blue: '/mascot/syra-blue.webp',
    gold: '/mascot/syra-gold.webp',
    sakura: '/mascot/syra-sakura.webp',
    mono: '/mascot/syra-mono.webp',
  } as Record<string, string>,
} as const

export type MascotMood = keyof typeof MASCOT.images

export function mascotImage(mood: string = 'wave') {
  return (MASCOT.images as Record<string, string>)[mood] ?? MASCOT.images.wave
}

export function mascotTheme(theme: string) {
  return MASCOT.themes[theme] ?? MASCOT.images.portrait
}
