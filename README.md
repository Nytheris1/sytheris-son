# SYTHERIS

Anime keşif platformu — Next.js 16, React 19, Tailwind CSS 4.

## Kurulum

```bash
pnpm install
pnpm dev
```

## Ortam değişkenleri (.env.local)

| Değişken | Açıklama |
| --- | --- |
| ADMIN_PASSWORD | /admin paneli şifresi |
| SESSION_SECRET | Oturum imzalama anahtarı (openssl rand -base64 32) |
| DATABASE_URL | Neon / Postgres bağlantısı (kalıcı veri) |
| DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET | Discord ile giriş |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google ile giriş |
| GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET | GitHub ile giriş |
| GEMINI_API_KEY | Gemini yapay zekâ (bulut yedek) |
| OLLAMA_URL / OLLAMA_MODEL | Sunucudan erişilebilir Ollama (opsiyonel) |

## Intro ve tanıtım

- İlk açılışta kısa bir yükleme sahnesi oynar (`components/shell/intro.tsx`); ilk kez gelen ziyaretçi `/hosgeldin` sayfasına alınır.
- `/hosgeldin` kaydırmayla oynayan 3D tanıtım filmidir (`components/welcome/prologue/`): pencere → kapak tüneli → kelime makarası → Syra. Ardından dergi tarzı tanıtım bölümleri gelir. `Esc` ya da "Geç" filmi atlar.

## Kontrol merkezi (gizli yönetim paneli)

Panel `/sy-core` adresindedir ve sitede hiçbir yerde bağlantısı yoktur. Açmak için:

- `Ctrl` / `Cmd` + `Shift` + `Y`
- Bir metin alanında değilken `sycore` yazmak
- Mobilde üst menüdeki SYTHERIS logosuna ~2,5 sn basılı tutmak

`ADMIN_PASSWORD` ile giriş tam yetki verir. Kullanıcılara panelden "Moderatör" rolü atanırsa kendi hesaplarıyla girip yalnızca topluluk/moderasyon sekmelerini görürler.

## Sytheris+ abonelik

Planlar kod ile etkinleşir: Kontrol merkezi › Abonelik kodları bölümünden kod üretip kullanıcılara dağıtın; kullanıcılar `/abonelik` sayfasından kodu girer.

## Çizim Atölyesi

- `/atolye` — herkese açık topluluk galerisi (haftanın eseri, beğeni, paylaşım).
- `/atolye/studyo` — Sytheris+ üyelerine özel tarayıcı stüdyosu: 16 katman, 11 karışım modu, basınca duyarlı fırçalar, sabitleyici, simetri, ayna görünüm, boya kovası, şekiller, görsel içe aktarma, buluta taslak kaydı (Ctrl+S) ve tek tıkla galeride sergileme.

## Link avcısı (mp4 / m3u8)

Kontrol merkezi › İçerik › **Link avcısı**. Bir bölüm sayfasının bağlantısını yapıştır; sayfa, içindeki gömülü oynatıcılar (iframe), oynatıcı betikleri, paketlenmiş (p,a,c,k,e,d) ve base64 ile gizlenmiş kaynaklar taranır, bulunan her mp4 / m3u8 sunucuda doğrulanır.

- **Önizle / İzle**: kaynak indirilmeden, imzalı `/api/medya` bağlantısıyla gömülü oynar.
- **Kaydet**: kaynak "Kayıtlı kaynaklar" listesine eklenir.
- **Bölüme ekle**: kaynağı bir animenin bölümüne bağlar; bölüm sayfası aynı imzalı bağlantıyla oynar.

Güvenlik: yalnızca yöneticiler kullanabilir, her yönlendirme adımında özel ağ (SSRF) koruması vardır, dakikada 12 tarama sınırı uygulanır, her işlem denetim kaydına yazılır. `/api/medya` yalnızca sunucunun HMAC ile imzaladığı adresleri aktarır, açık proxy olarak kullanılamaz. Giriş, captcha ya da DRM adımından sonra oluşan kaynaklar okunamaz.

## Projeyi indirme (gizli sayfa)

`/indir` sayfasındaki buton, projenin tamamını (node_modules, .next ve .env hariç) giriş istemeden ZIP olarak indirir. Dosyalar açık olan sayfanın kendi adresine giden sunucu eylemleriyle 2 MB'lık parçalar hâlinde çekilir ve ZIP tarayıcıda oluşturulur; bu yüzden 401 / Unauthorized hatası vermez. Olmazsa `/api/indir` akışı denenir.

Sayfayı tamamen kaldırmak için: `node indir-kaldir.mjs`. Geçici kapatmak için ortam değişkeni: `INDIR_DISABLED=1`.

OAuth callback adresi: `https://ALANADIN/api/auth/{discord|google|github}/callback`

Yerel Ollama'nın tarayıcıdan kullanılabilmesi için Ollama'yı `OLLAMA_ORIGINS=*` ile başlatın.
