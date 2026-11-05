import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  href,
  hrefLabel = 'Tümünü gör',
  as: Tag = 'h2',
}: {
  eyebrow?: string
  title: string
  accent?: string
  description?: string
  href?: string
  hrefLabel?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        {eyebrow && (
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" />
            {eyebrow}
          </p>
        )}
        <Tag className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
          {title} {accent && <span className="accent-serif">{accent}</span>}
        </Tag>
        {description && <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground transition hover:text-ink">
          {hrefLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
