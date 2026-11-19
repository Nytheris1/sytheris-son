'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Check, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { confirmCurrentEmail, confirmEmailChange, linkPasswordLogin, removeAccount, sendVerificationCode, updateEmail, updateIdentity, updatePassword } from '@/app/actions/account'
import { CodeInput } from '@/components/auth/code-input'
import { cn } from '@/lib/utils'

type ActionResult = { ok: true; message?: string; step?: 'verify'; masked?: string; devCode?: string } | { ok: false; error: string }

export function useAction() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<ActionResult>, onOk?: (r: Extract<ActionResult, { ok: true }>) => void) => {
    setError(null)
    start(async () => {
      try {
        const r = await fn()
        if (r.ok) {
          if (r.message) toast.success(r.message)
          onOk?.(r)
        } else setError(r.error)
      } catch {
        setError('Bağlantı hatası. Tekrar dene.')
      }
    })
  }
  return { pending, error, run }
}

export function Field({
  label,
  hint,
  type = 'text',
  value,
  onChange,
  autoComplete,
  prefix,
  maxLength,
  required = true,
}: {
  label: string
  hint?: string
  type?: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  prefix?: string
  maxLength?: number
  required?: boolean
}) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && <span className="pointer-events-none absolute left-3.5 font-mono text-sm text-muted-foreground">{prefix}</span>}
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn('h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15', prefix && 'pl-8', isPassword && 'pr-11')}
        />
        {isPassword && (
          <button type="button" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Şifreyi gizle' : 'Şifreyi göster'} className="absolute right-1.5 grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">
            {reveal ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

export function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-zçğıöşü]/.test(pw) && /[A-ZÇĞİÖŞÜ]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(pw)) score++
  const level = Math.min(4, score)
  return { level, label: ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'][level] }
}

function StrengthMeter({ value }: { value: string }) {
  if (!value) return null
  const { level, label } = passwordStrength(value)
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={cn('h-1.5 rounded-full transition-colors', n <= level ? (level <= 1 ? 'bg-destructive' : level === 2 ? 'bg-primary/60' : 'bg-primary') : 'bg-muted')} />
        ))}
      </div>
      <span className="w-20 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      {error}
    </p>
  )
}

function Submit({ pending, children, disabled, tone = 'primary' }: { pending: boolean; children: React.ReactNode; disabled?: boolean; tone?: 'primary' | 'danger' }) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        'flex h-11 w-fit items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger' ? 'bg-destructive text-background hover:brightness-110' : 'bg-primary text-primary-foreground hover:brightness-110',
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function IdentityForm({ displayName, username }: { displayName: string; username: string }) {
  const router = useRouter()
  const [name, setName] = useState(displayName)
  const [handle, setHandle] = useState(username)
  const { pending, error, run } = useAction()
  const dirty = name.trim() !== displayName || handle.trim() !== username
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateIdentity({ displayName: name, username: handle }), () => router.refresh())
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Görünen ad" value={name} onChange={setName} maxLength={40} autoComplete="nickname" hint="Yorumlarda ve profilinde görünür." />
        <Field label="Kullanıcı adı" value={handle} onChange={(v) => setHandle(v.toLowerCase().replace(/\s/g, ''))} prefix="@" maxLength={20} autoComplete="username" hint="Harf, rakam, nokta ve alt çizgi. Profil adresin değişir." />
      </div>
      <FormError error={error} />
      <Submit pending={pending} disabled={!dirty}>
        Kaydet
      </Submit>
    </form>
  )
}

function VerifyStep({ masked, devCode, pending, error, onConfirm, onCancel }: { masked: string; devCode?: string; pending: boolean; error: string | null; onConfirm: (code: string) => void; onCancel: () => void }) {
  const [code, setCode] = useState('')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (code.length === 6) onConfirm(code)
      }}
    >
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
        <span>
          <span className="font-medium text-foreground">{masked}</span> adresine 6 haneli bir kod gönderdik. Kod 10 dakika geçerli.
        </span>
      </p>
      {devCode && (
        <p className="rounded-xl border border-dashed border-primary/50 px-3.5 py-2 font-mono text-xs text-muted-foreground">
          Önizleme modu · kod: <span className="font-semibold tracking-[0.3em] text-ink">{devCode}</span>
        </p>
      )}
      <div className="max-w-sm">
        <CodeInput value={code} onChange={setCode} onComplete={onConfirm} disabled={pending} tone="light" />
      </div>
      <FormError error={error} />
      <div className="flex items-center gap-3">
        <Submit pending={pending} disabled={code.length !== 6}>
          Doğrula
        </Submit>
        <button type="button" onClick={onCancel} className="text-sm text-muted-foreground transition hover:text-foreground">
          Vazgeç
        </button>
      </div>
    </form>
  )
}

export function VerifiedStatus({ verified }: { verified: boolean }) {
  const router = useRouter()
  const { pending, error, run } = useAction()
  const [pendingCode, setPendingCode] = useState<{ masked: string; devCode?: string } | null>(null)
  if (verified) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm">
        <BadgeCheck className="size-4 text-ink" aria-hidden="true" />
        <span>
          E-postan <span className="font-semibold">doğrulanmış</span>. Profilinde Doğrulanmış rozeti görünüyor.
        </span>
      </p>
    )
  }
  if (pendingCode) {
    return (
      <VerifyStep
        {...pendingCode}
        pending={pending}
        error={error}
        onCancel={() => setPendingCode(null)}
        onConfirm={(code) =>
          run(
            () => confirmCurrentEmail({ code }),
            () => {
              setPendingCode(null)
              router.refresh()
            },
          )
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">E-postan henüz doğrulanmadı. Doğrula, Doğrulanmış rozetini kazan.</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => sendVerificationCode(), (r) => r.step === 'verify' && setPendingCode({ masked: r.masked ?? '', devCode: r.devCode }))}
        className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <BadgeCheck className="size-4" aria-hidden="true" />}
        Kod gönder
      </button>
      {error && (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          {error}
        </p>
      )}
    </div>
  )
}

export function EmailForm({ current, verified = false }: { current: string; verified?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingCode, setPendingCode] = useState<{ masked: string; devCode?: string } | null>(null)
  const { pending, error, run } = useAction()

  if (pendingCode) {
    return (
      <VerifyStep
        {...pendingCode}
        pending={pending}
        error={error}
        onCancel={() => setPendingCode(null)}
        onConfirm={(code) =>
          run(
            () => confirmEmailChange({ email, code }),
            () => {
              setPendingCode(null)
              setEmail('')
              setPassword('')
              router.refresh()
            },
          )
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <VerifiedStatus verified={verified} />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          run(
            () => updateEmail({ email, password }),
            (r) => {
              if (r.step === 'verify') {
                setPendingCode({ masked: r.masked ?? email, devCode: r.devCode })
                return
              }
              setEmail('')
              setPassword('')
              router.refresh()
            },
          )
        }}
      >
        <p className="text-sm text-muted-foreground">
          Şu an: <span className="font-medium text-foreground">{current}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Yeni e-posta" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Mevcut şifre" type="password" value={password} onChange={setPassword} autoComplete="current-password" hint="Değişikliği onaylamak için." />
        </div>
        <FormError error={error} />
        <Submit pending={pending} disabled={!email || !password}>
          Kod gönder ve değiştir
        </Submit>
      </form>
    </div>
  )
}

export function PasswordForm() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const { pending, error, run } = useAction()
  const mismatch = confirm.length > 0 && confirm !== next
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (next !== confirm) return
        run(
          () => updatePassword({ current, next }),
          () => {
            setCurrent('')
            setNext('')
            setConfirm('')
            router.refresh()
          },
        )
      }}
    >
      <Field label="Mevcut şifre" type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Yeni şifre" type="password" value={next} onChange={setNext} autoComplete="new-password" hint="En az 8 karakter, bir harf ve bir rakam." />
        <Field label="Yeni şifre (tekrar)" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" hint={mismatch ? 'Şifreler eşleşmiyor.' : undefined} />
      </div>
      <StrengthMeter value={next} />
      <FormError error={error} />
      <Submit pending={pending} disabled={!current || !next || mismatch}>
        Şifreyi değiştir
      </Submit>
    </form>
  )
}

export function LinkPasswordForm({ suggestedEmail }: { suggestedEmail?: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState(suggestedEmail ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { pending, error, run } = useAction()
  const mismatch = confirm.length > 0 && confirm !== password
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (password !== confirm) return
        run(() => linkPasswordLogin({ email, password }), () => router.refresh())
      }}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">Sosyal hesabına erişimini kaybedersen diye yedek bir giriş yolu ekle. Bu e-posta ve şifreyle de hesabına girebilirsin.</p>
      <Field label="E-posta" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Şifre" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint="En az 8 karakter, bir harf ve bir rakam." />
        <Field label="Şifre (tekrar)" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" hint={mismatch ? 'Şifreler eşleşmiyor.' : undefined} />
      </div>
      <StrengthMeter value={password} />
      <FormError error={error} />
      <Submit pending={pending} disabled={!email || !password || mismatch}>
        E-posta ile girişi ekle
      </Submit>
    </form>
  )
}

export function DeleteAccountForm({ username, needsPassword }: { username: string; needsPassword: boolean }) {
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const { pending, error, run } = useAction()
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () => removeAccount({ confirm, password }),
          () => {
            window.location.href = '/'
          },
        )
      }}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Profilin, favorilerin ve kozmetiklerin kalıcı olarak silinir. Bu işlem geri alınamaz. Onaylamak için <span className="font-mono font-semibold text-foreground">{username}</span> yaz.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kullanıcı adı" value={confirm} onChange={setConfirm} autoComplete="off" />
        {needsPassword && <Field label="Şifre" type="password" value={password} onChange={setPassword} autoComplete="current-password" />}
      </div>
      <FormError error={error} />
      <Submit pending={pending} tone="danger" disabled={confirm.trim().toLowerCase() !== username.toLowerCase() || (needsPassword && !password)}>
        Hesabımı kalıcı olarak sil
      </Submit>
    </form>
  )
}
