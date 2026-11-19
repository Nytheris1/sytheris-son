import Link from 'next/link'
import { Cursor } from './doodles'
import { PROFILE } from './data'

function Sep() {
  return (
    <span className="text-xl text-[var(--fo-ink)]/70" aria-hidden="true">
      ✷
    </span>
  )
}

export function Contact() {
  const pills = [
    PROFILE.email && { label: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
    PROFILE.phone && { label: PROFILE.phone, href: `tel:${PROFILE.phone.replace(/\s/g, '')}`, external: false },
    ...PROFILE.links.map((l) => ({ label: l.label, href: l.href, external: true })),
  ].filter(Boolean) as { label: string; href: string; external: boolean }[]

  return (
    <footer id="iletisim" aria-labelledby="fo-contact" className="relative">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center gap-12 px-5 pb-14 pt-24 text-center sm:px-8 lg:px-12">
        <p className="font-hand -rotate-2 text-4xl text-[var(--fo-hot)]">bir şeyler mi yapalım?</p>
        <h2 id="fo-contact" className="font-anton text-[clamp(3.5rem,12vw,9rem)] uppercase leading-[0.85] text-[var(--fo-ink)]">
          Yaz bana
        </h2>

        <div className="flex flex-col items-center gap-2">
          <span className="font-anton flex flex-col text-3xl uppercase leading-[0.85] tracking-wide text-[var(--fo-ink)]">
            <span>{PROFILE.logoTop}</span>
            <span>{PROFILE.logoBottom}</span>
          </span>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          {pills.map((p, i) => (
            <li key={p.href} className="flex items-center gap-6">
              {i > 0 && <Sep />}
              <a
                href={p.href}
                target={p.external ? '_blank' : undefined}
                rel={p.external ? 'noopener noreferrer' : undefined}
                className="relative rounded-full border-2 border-[var(--fo-ink)] px-5 py-2 text-sm text-[var(--fo-ink)] transition hover:bg-[var(--fo-ink)] hover:text-[var(--fo-bg)]"
              >
                {p.label}
                {i === pills.length - 1 && <Cursor className="pointer-events-none absolute -bottom-6 -right-4 w-8 rotate-[-12deg] text-[var(--fo-ink)]" />}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--fo-ink)]/45">
          © {new Date().getFullYear()} {PROFILE.name} ·{' '}
          <Link href="/" className="underline-offset-4 hover:text-[var(--fo-ink)] hover:underline">
            Sytheris’e dön
          </Link>
        </p>
      </div>
    </footer>
  )
}
