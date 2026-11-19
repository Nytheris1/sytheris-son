/* Animated mosaic of anime covers used behind the intro and the login screen. */
export function CoverWall({ covers, columns = 6 }: { covers: string[]; columns?: number }) {
  if (!covers.length) return <div className="absolute inset-0 bg-scrim" />
  const cols = Array.from({ length: columns }, (_, c) => {
    const list = covers.filter((_, i) => i % columns === c)
    const filled = list.length ? list : covers.slice(0, 4)
    return [...filled, ...filled]
  })
  return (
    <div className="absolute inset-0 flex gap-3 overflow-hidden opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]" aria-hidden="true">
      {cols.map((list, c) => (
        <div
          key={c}
          className={`min-w-0 flex-1 flex-col gap-3 ${c >= 4 ? 'hidden lg:flex' : c >= 3 ? 'hidden sm:flex' : 'flex'}`}
          style={{
            animation: `marquee ${50 + (c % 3) * 14}s linear infinite`,
            animationDirection: c % 2 ? 'reverse' : 'normal',
          }}
        >
          {list.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src || '/placeholder.svg'} alt="" loading="eager" decoding="async" className="aspect-[2/3] w-full rounded-xl object-cover" />
          ))}
        </div>
      ))}
    </div>
  )
}
