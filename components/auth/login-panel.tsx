'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { themeName } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { BrandIcon } from '@/components/ui-kit/brand-icon'
import { ScrambleText } from '@/components/shell/scramble-text'

type P = { id: 'discord' | 'google' | 'github'; label: string; configured: boolean }

const ERRORS: Record<string, string> = {
  not_configured: 'Bu giriş yöntemi henüz yönetici tarafından yapılandırılmadı.',
  denied: 'Giriş iptal edildi.',
  state: 'Oturum doğrulanamadı, lütfen tekrar dene.',
  oauth: 'Sağlayıcıdan yanıt alınamadı. Tekrar dene.',
  banned: 'Bu hesap askıya alınmış.',
  provider: 'Geçersiz giriş yöntemi.',
}

export function LoginPanel({ providers, error, errorProvider, registrationsOpen }: { providers: P[]; error?: string; errorProvider?: string; registrationsOpen: boolean }) {
  const router = useRouter()
  const { theme } = useTheme()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showEmail, setShowEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState(error ? (ERRORS[error] ?? 'Bir hata oluştu.') : '')

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== 'sy-auth') return
      if (e.data.ok) {
        toast.success('Giriş yapıldı')
        router.replace('/profil')
        router.refresh()
      } else setErr(ERRORS[e.data.message] ?? 'Giriş başarısız oldu.')
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [router])

  function oauth(e: React.MouseEvent<HTMLAnchorElement>, p: P) {
    if (!p.configured) {
      e.preventDefault()
      setErr(`${p.label} girişi henüz yapılandırılmadı. Yönetici panelinden ${p.id.toUpperCase()}_CLIENT_ID ve ${p.id.toUpperCase()}_CLIENT_SECRET eklenmeli.`)
      return
    }
    if (window.self !== window.top) {
      e.preventDefault()
      const w = 520
      const h = 720
      window.open(`/api/auth/${p.id}?popup=1`, 'sy-auth', `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2}`)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...form }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Bir hata oluştu')
      toast.success(mode === 'register' ? 'Hesabın oluşturuldu' : 'Tekrar hoş geldin')
      router.replace('/profil')
      router.refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.1 }}
      className="w-full max-w-md overflow-hidden rounded-[2rem] border border-foreground/10 bg-scrim/60 p-7 shadow-2xl backdrop-blur-2xl sm:p-9"
    >
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-none" aria-label="Ana sayfa">
          <span className="text-xl font-bold tracking-tight">SYTHERIS</span>
          <span className="mt-1.5 flex items-center gap-2">
            <span className="h-px w-5 bg-primary" />
            <ScrambleText text={themeName(theme)} className="font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-primary" />
          </span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Siteye dön
        </Link>
      </div>

      <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight">
        {mode === 'login' ? 'Tekrar' : 'Aramıza'} <span className="font-serif font-normal italic text-primary">{mode === 'login' ? 'hoş geldin' : 'katıl'}</span>
      </h1>
      <p className="mt-3 text-pretty leading-relaxed text-foreground/60">Favorilerini kaydet, profilini kişiselleştir ve kendi müziğini ekle.</p>

      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/15 px-4 py-3 text-sm text-foreground">
            {err}
            {errorProvider && error === 'not_configured' ? ` (${errorProvider})` : ''}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {!showEmail ? (
          <motion.div key="oauth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-7 flex flex-col gap-3">
            {providers.map((p, i) => (
              <motion.a
                key={p.id}
                href={`/api/auth/${p.id}`}
                onClick={(e) => oauth(e, p)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                aria-disabled={!p.configured}
                className={cn(
                  'group flex h-14 items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-5 font-medium transition hover:border-primary/60 hover:bg-foreground/10',
                  !p.configured && 'opacity-60',
                )}
              >
                <BrandIcon name={p.id} className="size-5 text-foreground" />
                <span className="flex-1">{p.label} ile devam et</span>
                {!p.configured && <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/50">Kurulmadı</span>}
                <ArrowRight className="size-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </motion.a>
            ))}
            <motion.button
              type="button"
              onClick={() => {
                setShowEmail(true)
                setErr('')
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="group flex h-14 items-center gap-4 rounded-2xl bg-primary px-5 font-medium text-primary-foreground transition hover:brightness-110"
            >
              <Mail className="size-5" />
              <span className="flex-1 text-left">E-posta ile devam et</span>
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.form key="email" onSubmit={submit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="mt-7 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-foreground/5 p-1" role="tablist">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} disabled={m === 'register' && !registrationsOpen} onClick={() => setMode(m)} className={cn('rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-40', mode === m ? 'bg-foreground text-background' : 'text-foreground/60')}>
                  {m === 'login' ? 'Giriş yap' : 'Kayıt ol'}
                </button>
              ))}
            </div>
            {mode === 'register' && (
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Görünen ad" aria-label="Görünen ad" autoComplete="nickname" maxLength={40} className="h-13 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 outline-none transition focus:border-primary" />
            )}
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" aria-label="E-posta" autoComplete="email" className="h-13 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 outline-none transition focus:border-primary" />
            <div className="relative">
              <input
                required
                type={showPw ? 'text' : 'password'}
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Şifre (en az 8 karakter)"
                aria-label="Şifre"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="h-13 w-full rounded-2xl border border-foreground/10 bg-foreground/5 px-4 pr-12 outline-none transition focus:border-primary"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-foreground/60 hover:text-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button type="submit" disabled={busy} className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
            </button>
            <button type="button" onClick={() => setShowEmail(false)} className="flex items-center justify-center gap-1.5 py-2 text-sm text-foreground/60 transition hover:text-foreground">
              <ArrowLeft className="size-4" /> Diğer yöntemler
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-xs leading-relaxed text-foreground/45">
        Devam ederek Sytheris kullanım koşullarını kabul etmiş olursun. Bilgilerin yalnızca hesabını oluşturmak için kullanılır.
      </p>
    </motion.div>
  )
}
