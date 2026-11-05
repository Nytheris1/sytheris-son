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

OAuth callback adresi: `https://ALANADIN/api/auth/{discord|google|github}/callback`

Yerel Ollama'nın tarayıcıdan kullanılabilmesi için Ollama'yı `OLLAMA_ORIGINS=*` ile başlatın.
