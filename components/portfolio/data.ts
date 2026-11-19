/*
 * /portfolyo sayfasındaki HER ŞEY bu dosyadan gelir. Tasarım koduna dokunmadan
 * metinleri, fotoğrafı, işleri ve iletişim bilgilerini buradan değiştir.
 * Ayrıntılı anlatım: sitede /rehber sayfası → "Portfolyo" bölümü.
 */

export const PROFILE = {
  /** Sayfa başlığında ve logoda görünen isim. */
  name: 'Nytheris',
  /** İki satırlık logo için: ilk ve ikinci kelime. */
  logoTop: 'NYTH',
  logoBottom: 'ERIS',
  role: 'Arayüz tasarımcısı ve ön yüz geliştirici',
  /** Polaroid fotoğraf. public/folio/ klasörüne kendi fotoğrafını koyup adını buraya yaz. */
  photo: '/folio/me.webp',
  photoAlt: 'Nytheris’in siyah beyaz portresi',
  /** Polaroidin altındaki el yazısı notlar. */
  photoNoteLeft: '21 yaşında',
  photoNoteRight: 'İstanbul · TR',
  /** Fotoğrafın etrafında dönen yuvarlak yazı. */
  ringWords: ['TASARIMCI', 'GELİŞTİRİCİ', 'ÇİZER'],
  /** Dev başlık. */
  hello: 'SELAM!!',
  /** Başlığın altındaki tanıtım cümlesi. */
  intro: 'Adım Nytheris. İstanbul’da yaşayan bir arayüz tasarımcısı, ön yüz geliştirici ve çizerim.',
  /** Kalın girişli kısa paragraflar (referanstaki "Ever since" / "I live to"). */
  statements: [
    { lead: 'Kendimi bildim bileli', text: 'görsel iletişime ayrı bir merakım oldu; en basit eskizden en detaylı sunuma kadar.' },
    { lead: 'Yaşama sebebim', text: 'yeni ifade yollarını keşfetmek ve bunları başkaları için de mümkün kılmak.' },
  ],
  city: 'İstanbul',
  timeZone: 'Europe/Istanbul',
  available: true,
  /** Alt kısımdaki hap şeklindeki iletişim bağlantıları. Boş bırakılanlar gizlenir. */
  email: 'merhaba@nytheris.dev',
  phone: '',
  links: [{ label: 'github.com/Nytheris1', href: 'https://github.com/Nytheris1' }],
}

export type Work = { title: string; kind: string; year: string; image: string; alt: string; summary: string; role: string }

export const WORKS: Work[] = [
  {
    title: 'Mavi Saat',
    kind: 'Marka kimliği · Ambalaj',
    year: '2026',
    image: '/folio/kahve.png',
    alt: 'Koyu taş zemin üzerinde mat lacivert kahve paketleri, kartvizit ve seramik fincan.',
    summary: 'Küçük bir kahve kavurma atölyesi için logodan paket etiketine uzanan, şafaktan önceki o mavi saatten ilham alan sakin bir kimlik.',
    role: 'Kimlik, ambalaj, baskı',
  },
  {
    title: 'Nem',
    kind: 'Mobil uygulama · Arayüz',
    year: '2025',
    image: '/folio/uygulama.png',
    alt: 'Yağmurlu bir gece sokağında elde tutulan telefonda minimal bir hava durumu uygulaması.',
    summary: 'Gürültüsüz bir hava durumu uygulaması: tek ekran, büyük ince rakamlar ve havanın rengine göre değişen yumuşak bir arka plan.',
    role: 'Ürün tasarımı, prototip, React Native',
  },
  {
    title: 'Gece Yazısı',
    kind: 'Tipografi · Poster serisi',
    year: '2025',
    image: '/folio/poster.png',
    alt: 'Beton galeri duvarında lacivert kâğıda basılmış üç büyük tipografik poster.',
    summary: 'Harf formlarını ışık ve gölge gibi ele alan üç parçalık bir poster serisi. Küçük bir grup sergisinde basıldı.',
    role: 'Tipografi, baskı hazırlığı',
  },
  {
    title: 'Beton Defter',
    kind: 'Editoryal · Dergi tasarımı',
    year: '2024',
    image: '/folio/dergi.png',
    alt: 'Ceviz masada açık duran, bir sayfasında siyah beyaz beton merdiven fotoğrafı olan mimari dergi.',
    summary: 'Brütalist yapıları fotoğraflayan bağımsız bir dergi için bol boşluklu, fotoğrafa yer açan bir sayfa sistemi.',
    role: 'Grid sistemi, sayfa tasarımı',
  },
]

export const SKILLS: { group: string; items: string[] }[] = [
  { group: 'Tasarım', items: ['Arayüz ve deneyim', 'Tipografi', 'Marka kimliği', 'Hareket tasarımı'] },
  { group: 'Geliştirme', items: ['React ve Next.js', 'TypeScript', 'Tailwind CSS', 'Three.js ve WebGL'] },
  { group: 'Araçlar', items: ['Figma', 'Blender', 'After Effects', 'Git'] },
]

export const TIMELINE: { years: string; title: string; detail: string }[] = [
  { years: '2024 — bugün', title: 'Bağımsız tasarımcı ve geliştirici', detail: 'Küçük markalar ve girişimler için kimlik, arayüz ve web siteleri.' },
  { years: '2022 — 2024', title: 'Kişisel projeler', detail: 'Tipografi denemeleri, poster serileri ve açık kaynak arayüz bileşenleri.' },
  { years: '2021', title: 'İlk satır kod', detail: 'Bir poster için yazdığım küçük bir animasyon her şeyi başlattı.' },
]
