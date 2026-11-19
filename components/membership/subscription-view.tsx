'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { Check, Crown, Gem, KeyRound, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { redeemCode } from '@/app/actions/membership'
import { PLANS, type BadgeId, type CommentColor, type Tier } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { CosmeticsStudio } from './cosmetics-studio'
import { Mascot } from '@/components/mascot/mascot'
import { MASCOT } from '@/components/mascot/mascot-config'

type Viewer = {
  name: string
  username: string
  avatar?: string | null
  background?: string | null
  tier: Tier
  until: number | null
  frame: string
  overlay: string
  effect?: string
  nameStyle?: string
  commentColor: CommentColor
  nameplate?: string
  badges: BadgeId[]
} | null

const OUT = [0.16, 1, 0.3, 1] as const

const FAQ: [string, string][] = [
  ['Aboneliği nasıl etkinleştiririm?', 'Sytheris+ şu an davet / hediye kodlarıyla etkinleşiyor. Kodunu aşağıdaki alana gir; aboneliğin anında hesabına tanımlanır ve süresi mevcut abonelik süresine eklenir.'],
  ['Kodu nereden bulurum?', 'Kodlar etkinliklerde, çekilişlerde ve Sytheris ekibi tarafından dağıtılır. Kartla ödeme altyapısı çok yakında açılacak.'],
  ['Süre bittiğinde ne olur?', 'Hesabın Gezgin planına döner; listelerin ve favorilerin silinmez. Premium çerçeve ve afişler yeniden abone olana kadar kilitlenir.'],
  ['Hareketli avatarı nasıl eklerim?', 'Ayarlar › Profil bölümünde avatar adresine bir GIF veya animasyonlu WebP bağlantısı yapıştır. Ultra üyeler afiş olarak MP4/WebM video da kullanabilir.'],
]

export function SubscriptionView({ viewer }: { viewer: Viewer }) {
  const [code, setCode] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  const tier = viewer?.tier ?? 'free'

  const redeem = () => {
    if (!viewer) {
      router.push('/giris')
      return
    }
    start(async () => {
      const res = await redeemCode(code)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setCode('')
      toast.success(`${res.tier === 'ultra' ? 'Ultra' : 'Sytheris+'} etkin!${res.until ? ` ${new Date(res.until).toLocaleDateString('tr-TR')} tarihine kadar geçerli.` : ''}`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-24 pb-10">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_80%_0%,color-mix(in_oklch,var(--primary)_35%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-scrim/40 to-transparent" />
        <div className="grain absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-[1440px] items-end gap-8 px-4 pt-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-10">
          <div className="flex flex-col gap-6 pb-16">
            <motion.p initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: OUT }} className="label-mono flex items-center gap-3 text-primary">
              <span className="h-px w-10 bg-primary" /> Sytheris+
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: OUT }} className="text-balance text-5xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Profilin artık bir <span className="accent-serif text-primary">sahne.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: OUT }} className="max-w-xl text-pretty text-lg leading-relaxed text-foreground/70">
              Kızıl Kurdele seti, varaklı yorum mürekkepleri, hareketli afişler ve parlayan rozetler. Topluluğun içinde parla.
            </motion.p>
            {viewer && tier !== 'free' && (
              <p className="flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                {tier === 'ultra' ? 'Ultra' : 'Sytheris+'} aktif{viewer.until ? ` · ${new Date(viewer.until).toLocaleDateString('tr-TR')} tarihine kadar` : ''}
              </p>
            )}
          </div>
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 60, damping: 16, delay: 0.2 }} className="relative mx-auto aspect-square w-full max-w-[460px]">
            <Mascot pose="full" float className="size-full" say={tier === 'free' ? 'Bu çerçeveler sana çok yakışır!' : 'Parıltın göz kamaştırıyor!'} />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="plans">
        <h2 id="plans" className="sr-only">
          Planlar
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => {
            const current = p.id === tier
            const featured = p.id === 'plus'
            const Icon = p.id === 'ultra' ? Gem : p.id === 'plus' ? Crown : Sparkles
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: OUT }}
                className={cn('relative flex flex-col gap-6 overflow-hidden rounded-[2rem] border p-7', featured ? 'border-primary bg-card shadow-[0_30px_80px_-30px_var(--primary)]' : 'border-border bg-card')}
              >
                {featured && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">En popüler</span>}
                <span className={cn('grid size-12 place-items-center rounded-2xl', featured ? 'bg-primary text-primary-foreground' : 'bg-accent text-ink')}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                </div>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/ {p.period}</span>
                </p>
                <ul className="flex flex-col gap-2.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-ink" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {current ? (
                    <span className="flex h-12 items-center justify-center rounded-2xl border border-border text-sm font-medium text-muted-foreground">Mevcut planın</span>
                  ) : p.id === 'free' ? (
                    <span className="flex h-12 items-center justify-center rounded-2xl text-sm text-muted-foreground">Her zaman ücretsiz</span>
                  ) : (
                    <a href="#kod" className={cn('flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition', featured ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground')}>
                      <KeyRound className="size-4" /> Kodla etkinleştir
                    </a>
                  )}
                </div>
              </motion.li>
            )
          })}
        </ul>

        <div id="kod" className="grid scroll-mt-28 items-center gap-6 rounded-[2rem] border border-border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">
              Hediye ya da davet <span className="accent-serif">kodun</span> mu var?
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">Kodu gir; aboneliğin anında etkinleşsin. Kartla ödeme seçeneği çok yakında.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              redeem()
            }}
            className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          >
            <label htmlFor="code" className="sr-only">
              Abonelik kodu
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SY-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="h-12 rounded-2xl border border-border bg-background px-4 font-mono text-sm tracking-widest outline-none transition focus:border-primary sm:w-64"
            />
            <button type="submit" disabled={pending || (Boolean(viewer) && code.length < 6)} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {viewer ? 'Etkinleştir' : 'Giriş yap ve etkinleştir'}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="showcase">
        <div className="flex flex-col gap-3">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" /> Vitrin
          </p>
          <h2 id="showcase" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Kurdeleler, mürekkepler ve <span className="accent-serif">rozetler</span>
          </h2>
        </div>
        <CosmeticsStudio
          look={{
            tier,
            frame: viewer?.frame ?? 'ribbon',
            overlay: viewer?.overlay ?? 'ribbon',
            commentColor: viewer?.commentColor ?? 'crimson',
            nameplate: viewer?.nameplate ?? 'ribbon',
            badges: viewer?.badges ?? [],
            avatar: viewer?.avatar ?? MASCOT.images.avatar,
            background: viewer?.background ?? null,
            name: viewer?.name ?? 'Syra',
            username: viewer?.username ?? 'syra',
          }}
          interactive={Boolean(viewer)}
        />
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-semibold tracking-tight">
          Sıkça sorulan <span className="accent-serif">sorular</span>
        </h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-border bg-card p-5 open:border-primary/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="grid size-7 place-items-center rounded-full bg-muted text-sm transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
        {!viewer && (
          <Link href="/giris" className="mt-4 self-start rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            Hesap oluştur
          </Link>
        )}
      </section>
    </div>
  )
}
