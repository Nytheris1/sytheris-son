import Link from 'next/link'
import { headers } from 'next/headers'
import { Activity, AlertTriangle, Cpu, Film, LayoutDashboard, LogOut, Plug, Users, Wrench } from 'lucide-react'
import { adminLogout } from './actions'
import { getEpisodeCatalog, getLogs, getSettings, listEpisodes } from '@/lib/site'
import { storeBackend, storeHealth } from '@/lib/store'
import { listUsers, toPublic } from '@/lib/users'
import { providerStatus } from '@/lib/oauth'
import { cn } from '@/lib/utils'
import { SettingsForm } from '@/components/admin/settings-form'
import { EpisodeManager } from '@/components/admin/episode-manager'
import { IntegrationPanel } from '@/components/admin/integration-panel'
import { UsersTable } from '@/components/admin/users-table'
import { LogsPanel } from '@/components/admin/logs-panel'
import { TechActions } from '@/components/admin/tech-actions'

const TABS = [
  { id: 'genel', label: 'Genel bakış', icon: LayoutDashboard },
  { id: 'videolar', label: 'Videolar', icon: Film },
  { id: 'bakim', label: 'Site ve bakım', icon: Wrench },
  { id: 'entegrasyonlar', label: 'Entegrasyonlar', icon: Plug },
  { id: 'hatalar', label: 'Hata kayıtları', icon: AlertTriangle },
  { id: 'kullanicilar', label: 'Kullanıcılar', icon: Users },
  { id: 'teknik', label: 'Teknik', icon: Cpu },
] as const

const ENV_GROUPS: { title: string; vars: { key: string; note: string; required?: boolean }[] }[] = [
  { title: 'Güvenlik', vars: [{ key: 'ADMIN_PASSWORD', note: 'Yönetim paneli şifresi', required: true }, { key: 'SESSION_SECRET', note: 'Oturum imzalama anahtarı (önerilir)' }] },
  { title: 'Veritabanı', vars: [{ key: 'DATABASE_URL', note: 'Neon / Postgres — kalıcı kayıt için gerekli' }] },
  {
    title: 'Giriş yöntemleri',
    vars: [
      { key: 'DISCORD_CLIENT_ID', note: 'Discord OAuth' },
      { key: 'DISCORD_CLIENT_SECRET', note: 'Discord OAuth' },
      { key: 'GOOGLE_CLIENT_ID', note: 'Google OAuth' },
      { key: 'GOOGLE_CLIENT_SECRET', note: 'Google OAuth' },
      { key: 'GITHUB_CLIENT_ID', note: 'GitHub OAuth' },
      { key: 'GITHUB_CLIENT_SECRET', note: 'GitHub OAuth' },
    ],
  },
  { title: 'Yapay zekâ', vars: [{ key: 'GEMINI_API_KEY', note: 'Google Gemini (bulut yedek)' }, { key: 'GEMINI_MODEL', note: 'Varsayılan: gemini-flash-latest' }, { key: 'OLLAMA_URL', note: 'Sunucudan erişilebilir Ollama (opsiyonel)' }, { key: 'OLLAMA_MODEL', note: 'Varsayılan: llama3.2' }] },
]

function Stat({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="label-mono text-[9px] text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-3xl font-semibold tracking-tight', tone === 'warn' && 'text-destructive', tone === 'ok' && 'text-ink')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'genel' } = await searchParams
  const [settings, catalog, logs, users, health, h] = await Promise.all([getSettings(), getEpisodeCatalog(), getLogs(), listUsers(), storeHealth(), headers()])
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const origin = `${h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')}://${host}`
  const episodesByAnime = tab === 'videolar' ? await Promise.all(catalog.map(async (c) => ({ ...c, episodes: await listEpisodes(c.animeId) }))) : []
  const totalEpisodes = catalog.reduce((n, c) => n + c.count, 0)
  const errors24 = logs.filter((l) => l.level === 'error' && Date.now() - l.at < 86400_000).length
  const mem = process.memoryUsage()

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-10 lg:py-10">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-10 lg:self-start">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight">SYTHERIS</span>
          <span className="mt-1.5 flex items-center gap-2">
            <span className="h-px w-5 bg-primary" />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-ink">Yönetim</span>
          </span>
        </Link>
        <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Yönetim menüsü">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              aria-current={tab === t.id ? 'page' : undefined}
              className={cn('flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition', tab === t.id ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              <t.icon className="size-4" />
              {t.label}
              {t.id === 'hatalar' && errors24 > 0 && <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 font-mono text-[10px] text-on-scrim">{errors24}</span>}
            </Link>
          ))}
        </nav>
        <div className="hidden flex-col gap-2 rounded-3xl border border-border bg-card p-4 text-xs lg:flex">
          <p className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', settings.maintenance ? 'bg-destructive' : 'bg-primary')} />
            {settings.maintenance ? 'Bakım modu açık' : 'Site yayında'}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-3.5" /> Depo: {storeBackend() === 'postgres' ? 'Postgres' : 'Geçici bellek'} · {health.ms}ms
          </p>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-destructive transition hover:bg-destructive/10">
            <LogOut className="size-4" /> Çıkış yap
          </button>
        </form>
      </aside>

      <section className="flex min-w-0 flex-col gap-8">
        <header>
          <p className="label-mono text-ink">Yönetim paneli</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {TABS.find((t) => t.id === tab)?.label.split(' ')[0]} <span className="accent-serif">{TABS.find((t) => t.id === tab)?.label.split(' ').slice(1).join(' ') || 'paneli'}</span>
          </h1>
        </header>

        {storeBackend() === 'memory' && (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5 text-sm leading-relaxed">
            <p className="font-semibold">Kalıcı veritabanı bağlı değil</p>
            <p className="mt-1 text-muted-foreground">
              Kullanıcılar, videolar ve ayarlar şu an geçici bellekte tutuluyor ve sunucu yeniden başladığında silinebilir. Kalıcı kayıt için projeye Neon (Postgres) bağlayın; <code className="font-mono">DATABASE_URL</code> eklendiği anda tablo otomatik oluşturulur.
            </p>
          </div>
        )}

        {tab === 'genel' && (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat label="Kullanıcı" value={users.length} hint={`${users.filter((u) => Date.now() - u.createdAt < 7 * 86400_000).length} bu hafta`} />
              <Stat label="Bölüm" value={totalEpisodes} hint={`${catalog.length} animede`} />
              <Stat label="Hata (24s)" value={errors24} tone={errors24 ? 'warn' : 'ok'} hint={`${logs.length} toplam kayıt`} />
              <Stat label="Durum" value={settings.maintenance ? 'Bakım' : 'Yayında'} tone={settings.maintenance ? 'warn' : 'ok'} hint={settings.announcement ? 'Duyuru aktif' : 'Duyuru yok'} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="mb-4 font-semibold">Son eklenen bölümler</p>
                {catalog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz video eklenmedi.{' '}
                    <Link className="text-ink underline" href="/admin?tab=videolar">
                      İlk bölümü ekle
                    </Link>
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {catalog.slice(0, 5).map((c) => (
                      <li key={c.animeId} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.cover || '/placeholder.svg'} alt="" className="h-12 w-9 rounded-md object-cover" />
                        <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                        <span className="font-mono text-xs text-muted-foreground">{c.count} bölüm</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <p className="mb-4 font-semibold">Son hatalar</p>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Kayıtlı hata yok. Her şey yolunda.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {logs.slice(0, 5).map((l) => (
                      <li key={l.id} className="flex items-start gap-2 text-sm">
                        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', l.level === 'error' ? 'bg-destructive' : 'bg-primary')} />
                        <span className="line-clamp-1 flex-1">{l.message}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{new Date(l.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'videolar' && <EpisodeManager catalog={episodesByAnime} />}
        {tab === 'bakim' && <SettingsForm initial={settings} />}
        {tab === 'entegrasyonlar' && (
          <IntegrationPanel
            origin={origin}
            groups={ENV_GROUPS.map((g) => ({ ...g, vars: g.vars.map((v) => ({ ...v, set: Boolean(process.env[v.key]) })) }))}
            providers={providerStatus()}
          />
        )}
        {tab === 'hatalar' && <LogsPanel logs={logs} />}
        {tab === 'kullanicilar' && <UsersTable users={users.map(toPublic)} />}
        {tab === 'teknik' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat label="Node.js" value={process.version} />
              <Stat label="Ortam" value={process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? '—'} hint={process.env.VERCEL_REGION ? `Bölge: ${process.env.VERCEL_REGION}` : 'Yerel'} />
              <Stat label="Çalışma süresi" value={`${Math.floor(process.uptime() / 60)} dk`} hint="Bu sunucu örneği" />
              <Stat label="Bellek" value={`${Math.round(mem.rss / 1048576)} MB`} hint={`Heap ${Math.round(mem.heapUsed / 1048576)} MB`} />
            </div>
            <dl className="divide-y divide-border rounded-3xl border border-border bg-card px-6 font-mono text-sm">
              {[
                ['Commit', process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'yerel'],
                ['Dal', process.env.VERCEL_GIT_COMMIT_REF ?? '—'],
                ['Depo', `${storeBackend()} · ${health.ok ? 'sağlıklı' : 'hata'} · ${health.ms}ms`],
                ['Alan adı', host],
                ['Önbellek', 'AniList 30 dk · takvim 30 dk · arama 15 dk'],
                ['Güvenlik başlıkları', 'nosniff · HSTS · Referrer-Policy · Permissions-Policy'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="truncate text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <TechActions />
          </div>
        )}
      </section>
    </div>
  )
}
