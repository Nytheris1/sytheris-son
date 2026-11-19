'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { adminLogin } from '@/app/sy-core/actions'
import { Mascot } from '@/components/mascot/mascot'

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(adminLogin, null as null | { error?: string; ok?: boolean })
  useEffect(() => {
    if (state?.ok) router.refresh()
  }, [state, router])

  return (
    <main className="dark relative grid min-h-dvh place-items-center overflow-hidden bg-scrim px-4 text-foreground">
      <div className="grain absolute inset-0" />
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)', backgroundSize: '48px 48px' }} aria-hidden="true" />
      <form action={action} className="relative flex w-full max-w-sm flex-col gap-5 rounded-[2rem] border border-foreground/10 bg-foreground/[0.04] p-8 backdrop-blur-xl">
        <span className="relative w-fit">
          <Mascot pose="bust" className="size-16 ring-2 ring-primary" />
          <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-scrim">
            <LockKeyhole className="size-3.5" />
          </span>
        </span>
        <div>
          <p className="label-mono text-primary">Kısıtlı alan</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Kontrol <span className="font-serif font-normal italic text-primary">merkezi</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/60">Yönetici şifresini gir. Moderatörler kendi hesaplarıyla giriş yaptıktan sonra doğrudan erişir.</p>
        </div>
        {!configured && (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/15 p-3 text-sm">
            <strong>ADMIN_PASSWORD</strong> henüz tanımlanmadı. v0 ayarlarındaki <em>Vars</em> bölümünden ekledikten sonra giriş yapabilirsin.
          </p>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground/60">Şifre</span>
          <input suppressHydrationWarning name="password" type="password" required autoComplete="current-password" autoFocus className="h-13 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 outline-none transition focus:border-primary" />
        </label>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Giriş yap
        </button>
        <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-foreground/50 transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Siteye dön
        </Link>
      </form>
    </main>
  )
}
