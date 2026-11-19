'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { AtSign, ChevronDown, Download, KeyRound, LogOut, Mail, MonitorSmartphone, PlayCircle, ShieldAlert, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react'
import { signOutEverywhere } from '@/app/actions/account'
import { cn } from '@/lib/utils'
import { Card } from './settings-panel'
import { DeleteAccountForm, EmailForm, IdentityForm, LinkPasswordForm, PasswordForm, useAction } from './account-forms'

export type LoginEntry = { at: number; device: string; ip: string; method: string }

type Props = {
  provider: string
  email?: string | null
  passwordEmail?: string | null
  memberSince: number
  username: string
  displayName: string
  logins: LoginEntry[]
  passwordChangedAt?: number
  revokedAt?: number
  emailVerified?: boolean
}

const PROVIDERS: Record<string, string> = { discord: 'Discord', google: 'Google', github: 'GitHub', email: 'E-posta' }

function mask(email?: string | null) {
  return email ? email.replace(/(.{2}).+(@.+)/, '$1•••$2') : '—'
}

function ago(ts?: number) {
  if (!ts) return null
  const diff = Date.now() - ts
  const m = Math.round(diff / 60_000)
  if (m < 1) return 'az önce'
  if (m < 60) return `${m} dk önce`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} sa önce`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} gün önce`
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Section({
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
  tone,
}: {
  icon: typeof UserRound
  title: string
  summary: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  tone?: 'danger'
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button type="button" onClick={onToggle} aria-expanded={open} className="group flex w-full items-center gap-4 py-4 text-left">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl transition', tone === 'danger' ? 'bg-destructive/10 text-destructive' : open ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground')}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block font-medium', tone === 'danger' && 'text-destructive')}>{title}</span>
          <span className="block truncate text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="pb-6 pl-0 sm:pl-14">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SecurityScore({ items }: { items: { label: string; done: boolean; hint: string }[] }) {
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative grid size-28 shrink-0 place-items-center">
        <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
          <motion.circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * pct) / 100 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums tracking-tight">{pct}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">puan</span>
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5" aria-label="Güvenlik kontrol listesi">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-3 text-sm">
            <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', i.done ? 'bg-primary text-primary-foreground' : 'border border-dashed border-muted-foreground/50')}>
              {i.done && <ShieldCheck className="size-3" aria-hidden="true" />}
            </span>
            <span>
              <span className={cn('block font-medium', !i.done && 'text-muted-foreground')}>{i.label}</span>
              {!i.done && <span className="block text-xs text-muted-foreground">{i.hint}</span>}
            </span>
            <span className="sr-only">{i.done ? 'tamamlandı' : 'eksik'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AccountPanel({ provider, email, passwordEmail, memberSince, username, displayName, logins, passwordChangedAt, revokedAt, emailVerified }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id))
  const revoke = useAction()
  const hasPassword = Boolean(passwordEmail)
  const methods = [PROVIDERS[provider] ?? provider, ...(hasPassword && provider !== 'email' ? ['E-posta + şifre'] : [])]
  const freshPassword = passwordChangedAt ? Date.now() - passwordChangedAt < 180 * 86400_000 : provider === 'email' && Date.now() - memberSince < 180 * 86400_000

  const checklist = [
    { label: 'E-posta adresi tanımlı', done: Boolean(email || passwordEmail), hint: 'Hesabını kurtarabilmen için bir e-posta ekle.' },
    { label: 'E-posta doğrulandı', done: Boolean(emailVerified), hint: 'E-posta bölümünden kod iste ve Doğrulanmış rozetini kazan.' },
    { label: 'Şifreyle giriş açık', done: hasPassword, hint: 'Sosyal hesabın kapanırsa diye yedek bir şifre belirle.' },
    { label: 'Birden fazla giriş yolu', done: methods.length > 1, hint: provider === 'email' ? 'Profil sayfasından bir sosyal hesap bağlayarak yedek yol oluşturabilirsin.' : 'Yedek bir giriş yöntemi kilitlenme riskini azaltır.' },
    { label: 'Şifre son 6 ayda yenilendi', done: hasPassword && freshPassword, hint: hasPassword ? 'Şifreni düzenli aralıklarla değiştir.' : 'Önce bir şifre belirle.' },
    { label: 'Oturumlar gözden geçirildi', done: Boolean(revokedAt && Date.now() - revokedAt < 90 * 86400_000), hint: 'Tanımadığın cihazları aşağıdan kapat.' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card title="Güvenlik" accent="durumu">
        <p className="mb-6 text-sm text-muted-foreground">Eksik adımları tamamladıkça hesabın daha zor ele geçirilir.</p>
        <SecurityScore items={checklist} />
      </Card>

      <Card title="Hesap" accent="ayarları">
        <div className="mt-2">
          <Section icon={UserRound} title="Ad ve kullanıcı adı" summary={`${displayName} · @${username}`} open={open === 'identity'} onToggle={() => toggle('identity')}>
            <IdentityForm displayName={displayName} username={username} />
          </Section>

          <Section icon={Mail} title="E-posta" summary={hasPassword ? `${mask(passwordEmail)}${emailVerified ? ' · doğrulanmış' : ''}` : email ? `${mask(email)} · yalnızca iletişim` : 'Tanımlı değil'} open={open === 'email'} onToggle={() => toggle('email')}>
            {hasPassword ? <EmailForm current={mask(passwordEmail)} verified={Boolean(emailVerified)} /> : <LinkPasswordForm suggestedEmail={email} />}
          </Section>

          <Section
            icon={KeyRound}
            title="Şifre"
            summary={hasPassword ? (passwordChangedAt ? `Son değişiklik ${ago(passwordChangedAt)}` : 'Tanımlı') : 'Şifre yok — sosyal hesapla giriş'}
            open={open === 'password'}
            onToggle={() => toggle('password')}
          >
            {hasPassword ? <PasswordForm /> : <LinkPasswordForm suggestedEmail={email} />}
          </Section>

          <Section icon={AtSign} title="Giriş yöntemleri" summary={methods.join(' · ')} open={open === 'methods'} onToggle={() => toggle('methods')}>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                <span className="font-medium">{PROVIDERS[provider] ?? provider}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink">Bağlı · Ana yöntem</span>
              </li>
              {provider !== 'email' && (
                <li className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                  <span className="font-medium">E-posta + şifre</span>
                  {hasPassword ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink">Bağlı</span>
                  ) : (
                    <button type="button" onClick={() => setOpen('password')} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      Ekle
                    </button>
                  )}
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Üyelik başlangıcı: {new Date(memberSince).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </Section>
        </div>
      </Card>

      <Card title="Oturumlar ve" accent="cihazlar">
        <p className="mb-4 text-sm text-muted-foreground">Hesabına son giriş yapılan cihazlar. Tanımadığın bir giriş görürsen şifreni değiştir ve diğer oturumları kapat.</p>
        {logins.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Henüz kayıtlı giriş yok. Bir sonraki girişinden itibaren burada listelenecek.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {logins.map((l, i) => (
              <li key={`${l.at}-${i}`} className="flex items-center gap-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <MonitorSmartphone className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {l.device}
                    {i === 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink">Son giriş</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {l.ip} · {PROVIDERS[l.method] ?? l.method} · {ago(l.at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={revoke.pending}
          onClick={() => revoke.run(() => signOutEverywhere(), () => router.refresh())}
          className="mt-4 flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-destructive hover:text-destructive disabled:opacity-50"
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
          Diğer tüm oturumları kapat
        </button>
        {revoke.error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {revoke.error}
          </p>
        )}
      </Card>

      <Card title="Veri ve" accent="deneyim">
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/account/export" className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary">
            <Download className="size-4" aria-hidden="true" /> Verilerimi indir (JSON)
          </a>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem('sy-intro-seen')
                localStorage.removeItem('sy-intro')
                document.documentElement.classList.remove('intro-seen')
              } catch {}
              window.location.href = '/'
            }}
            className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary"
          >
            <PlayCircle className="size-4" aria-hidden="true" /> Açılışı tekrar oynat
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('sy-welcomed')
              } catch {}
              router.push('/hosgeldin')
            }}
            className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary"
          >
            <Sparkles className="size-4" aria-hidden="true" /> Tanıtım turu
          </button>
        </div>
      </Card>

      <Card title="Tehlikeli" accent="bölge">
        <div className="mt-2">
          <Section icon={Trash2} title="Hesabı sil" summary="Tüm verilerin kalıcı olarak silinir" open={open === 'delete'} onToggle={() => toggle('delete')} tone="danger">
            <DeleteAccountForm username={username} needsPassword={hasPassword} />
          </Section>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-medium text-destructive transition hover:bg-destructive/10">
            <LogOut className="size-4" aria-hidden="true" /> Çıkış yap
          </button>
        </form>
      </Card>
    </div>
  )
}
