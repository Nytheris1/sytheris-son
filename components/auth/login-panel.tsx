'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail, MailCheck, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { BrandIcon } from '@/components/ui-kit/brand-icon'
import { ScrambleText } from '@/components/shell/scramble-text'
import { CodeInput } from './code-input'

type P = { id: 'discord' | 'google' | 'github'; label: string; configured: boolean }

const ERRORS: Record<string, string> = {
  not_configured: 'Bu giriş yöntemi çok yakında aktif olacak.',
  denied: 'Giriş iptal edildi.',
  state: 'Oturum doğrulanamadı, lütfen tekrar dene.',
  oauth: 'Sağlayıcıdan yanıt alınamadı. Tekrar dene.',
  banned: 'Bu hesap askıya alınmış.',
  provider: 'Geçersiz giriş yöntemi.',
}

export function LoginPanel({ providers, error, errorProvider, registrationsOpen }: { providers: P[]; error?: string; errorProvider?: string; registrationsOpen: boolean }) {
  const router = useRouter()
  const { themeLabel } = useTheme()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showEmail, setShowEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState(error ? (ERRORS[error] ?? 'Bir hata oluştu.') : '')
  const [verify, setVerify] = useState<{ masked: string; devCode?: string } | null>(null)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== 'sy-auth') return
      if (e.data.ok) {
        toast.success('Giriş yapıldı')
        router.replace('/')
        router.refresh()
      } else setErr(ERRORS[e.data.message] ?? 'Giriş başarısız oldu.')
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [router])

  function oauth(e: React.MouseEvent<HTMLAnchorElement>, p: P) {
    if (!p.configured) {
      e.preventDefault()
      setErr(`${p.label} ile giriş çok yakında aktif olacak. Şimdilik e-posta ile devam edebilirsin.`)
      return
    }
    if (window.self !== window.top) {
      e.preventDefault()
      const w = 520
      const h = 720
      window.open(`/api/auth/${p.id}?popup=1`, 'sy-auth', `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2}`)
    }
  }

  async function call(payload: Record<string, unknown>) {
    const res = await fetch('/api/auth/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Bir hata oluştu')
    return json as { ok: true; step?: 'verify'; masked?: string; devCode?: string; verified?: boolean }
  }

  function finish(verified?: boolean) {
    toast.success(mode === 'register' ? 'Hesabın oluşturuldu' : 'Tekrar hoş geldin', verified ? { description: 'E-postan doğrulandı — Doğrulanmış rozeti profilinde.' } : undefined)
    router.replace('/')
    router.refresh()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const json = await call({ step: 'start', mode, ...form })
      if (json.step === 'verify') {
        setVerify({ masked: json.masked ?? form.email, devCode: json.devCode })
        setCode('')
        setCooldown(60)
        return
      }
      finish(json.verified)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function confirm(value = code) {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setErr('')
    try {
      const json = await call({ step: 'verify', mode, email: form.email, code: value })
      finish(json.verified)
    } catch (e) {
      setErr((e as Error).message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    if (cooldown > 0) return
    setErr('')
    try {
      const json = await call({ step: 'resend', mode, email: form.email })
      setVerify({ masked: json.masked ?? form.email, devCode: json.devCode })
      setCooldown(60)
      toast.success('Yeni kod gönderildi')
    } catch (e) {
      setErr((e as Error).message)
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
            <ScrambleText text={themeLabel} className="font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-primary" />
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
        {verify ? (
          <motion.form
            key="verify"
            onSubmit={(e) => {
              e.preventDefault()
              confirm()
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mt-7 flex flex-col gap-5"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-foreground/70">
                <span className="font-semibold text-foreground">{verify.masked}</span> adresine 6 haneli bir kod gönderdik. Kod 10 dakika geçerli.
              </p>
            </div>
            {verify.devCode && (
              <p className="rounded-xl border border-dashed border-primary/50 px-4 py-2.5 font-mono text-xs text-foreground/70">
                Önizleme modu (e-posta servisi bağlı değil) · kod: <span className="font-semibold tracking-[0.3em] text-primary">{verify.devCode}</span>
              </p>
            )}
            <CodeInput value={code} onChange={setCode} onComplete={(v) => confirm(v)} disabled={busy} />
            <button type="submit" disabled={busy || code.length !== 6} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Doğrula ve devam et
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setVerify(null)
                  setErr('')
                }}
                className="flex items-center gap-1.5 text-foreground/60 transition hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> E-postayı düzelt
              </button>
              <button type="button" onClick={resend} disabled={cooldown > 0} className="flex items-center gap-1.5 text-foreground/60 transition hover:text-foreground disabled:opacity-50">
                <RotateCw className="size-3.5" aria-hidden="true" />
                {cooldown > 0 ? `Tekrar gönder (${cooldown})` : 'Kodu tekrar gönder'}
              </button>
            </div>
          </motion.form>
        ) : !showEmail ? (
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
                {!p.configured && <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/50">Yakında</span>}
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
