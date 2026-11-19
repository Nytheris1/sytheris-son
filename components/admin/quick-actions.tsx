import Link from 'next/link'
import { AlertTriangle, BarChart3, Film, Flag, KeyRound, Megaphone, type LucideIcon } from 'lucide-react'

type Action = { href: string; label: string; hint: string; icon: LucideIcon; adminOnly?: boolean }

const ACTIONS: Action[] = [
  { href: '/sy-core?tab=moderasyon', label: 'Bildirimleri incele', hint: 'Bekleyen şikâyetler', icon: Flag },
  { href: '/sy-core?tab=analitik', label: 'Analitiği aç', hint: 'Kayıt ve etkinlik', icon: BarChart3 },
  { href: '/sy-core?tab=bakim', label: 'Duyuru yayınla', hint: 'Üst şerit ve bakım modu', icon: Megaphone, adminOnly: true },
  { href: '/sy-core?tab=abonelik', label: 'Abonelik kodu üret', hint: 'Sytheris+ ve Ultra', icon: KeyRound, adminOnly: true },
  { href: '/sy-core?tab=videolar', label: 'Bölüm ekle', hint: 'Video ve altyazı', icon: Film, adminOnly: true },
  { href: '/sy-core?tab=hatalar', label: 'Hataları gör', hint: 'Son 24 saat', icon: AlertTriangle, adminOnly: true },
]

export function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  const items = ACTIONS.filter((a) => isAdmin || !a.adminOnly)
  return (
    <section aria-labelledby="hizli-islemler" className="flex flex-col gap-3">
      <h2 id="hizli-islemler" className="text-sm font-medium text-muted-foreground">
        Hızlı işlemler
      </h2>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {items.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary">
              <Icon className="size-5 text-ink" aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
