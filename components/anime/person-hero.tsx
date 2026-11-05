export function PersonHero({
  image,
  label,
  head,
  tail,
  sub,
  children,
}: {
  image?: string | null
  label: string
  head: string
  tail: string
  sub?: string | null
  children?: React.ReactNode
}) {
  return (
    <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
      <div className="absolute inset-0 -z-10">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image || '/placeholder.svg'} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-3xl" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/80 to-scrim/40" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-page to-transparent" />
        <div className="grain absolute inset-0" />
      </div>
      <div className="mx-auto grid max-w-[1440px] items-end gap-8 px-4 pb-14 pt-16 sm:px-6 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] lg:gap-14 lg:px-10 lg:pt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/placeholder.svg'} alt="" className="mx-auto aspect-[3/4] w-44 rounded-3xl object-cover shadow-2xl ring-1 ring-foreground/10 sm:w-56 md:mx-0 md:w-full" />
        <div className="flex flex-col gap-5">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-10 bg-primary" />
            {label}
          </p>
          <div>
            <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {head} <span className="font-serif font-normal italic text-primary">{tail}</span>
            </h1>
            {sub && <p className="mt-3 text-lg text-foreground/50">{sub}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
      </div>
    </section>
  )
}
