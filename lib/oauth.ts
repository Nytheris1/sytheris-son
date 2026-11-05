import 'server-only'

export type OAuthProvider = 'discord' | 'google' | 'github'

type Profile = { id: string; name: string; email?: string | null; avatar?: string | null }

type Config = {
  label: string
  envId: string
  envSecret: string
  authorize: string
  token: string
  scope: string
  extra?: Record<string, string>
  profile: (accessToken: string) => Promise<Profile>
}

export const OAUTH: Record<OAuthProvider, Config> = {
  discord: {
    label: 'Discord',
    envId: 'DISCORD_CLIENT_ID',
    envSecret: 'DISCORD_CLIENT_SECRET',
    authorize: 'https://discord.com/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    scope: 'identify email',
    extra: { prompt: 'none' },
    async profile(token) {
      const res = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Discord profil hatası ${res.status}`)
      const u = (await res.json()) as { id: string; username: string; global_name?: string | null; avatar?: string | null; email?: string | null }
      const ext = u.avatar?.startsWith('a_') ? 'gif' : 'png'
      return {
        id: u.id,
        name: u.global_name || u.username,
        email: u.email,
        avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=512` : null,
      }
    },
  },
  google: {
    label: 'Google',
    envId: 'GOOGLE_CLIENT_ID',
    envSecret: 'GOOGLE_CLIENT_SECRET',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    extra: { prompt: 'select_account' },
    async profile(token) {
      const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Google profil hatası ${res.status}`)
      const u = (await res.json()) as { sub: string; name?: string; email?: string; picture?: string }
      return { id: u.sub, name: u.name || u.email?.split('@')[0] || 'Kullanıcı', email: u.email, avatar: u.picture?.replace('=s96-c', '=s512-c') }
    },
  },
  github: {
    label: 'GitHub',
    envId: 'GITHUB_CLIENT_ID',
    envSecret: 'GITHUB_CLIENT_SECRET',
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    async profile(token) {
      const res = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'sytheris' } })
      if (!res.ok) throw new Error(`GitHub profil hatası ${res.status}`)
      const u = (await res.json()) as { id: number; login: string; name?: string | null; avatar_url?: string; email?: string | null }
      return { id: String(u.id), name: u.name || u.login, email: u.email, avatar: u.avatar_url }
    },
  },
}

export function isProvider(p: string): p is OAuthProvider {
  return p === 'discord' || p === 'google' || p === 'github'
}

export function providerStatus() {
  return (Object.keys(OAUTH) as OAuthProvider[]).map((id) => ({
    id,
    label: OAUTH[id].label,
    configured: Boolean(process.env[OAUTH[id].envId] && process.env[OAUTH[id].envSecret]),
  }))
}

export function appOrigin(request: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const h = request.headers
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : new URL(request.url).origin
}
