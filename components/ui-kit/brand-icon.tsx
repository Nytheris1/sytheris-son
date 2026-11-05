import { cn } from '@/lib/utils'

const MONO = new Set(['github', 'x', 'tiktok'])
export const BRANDS = ['discord', 'google', 'github', 'instagram', 'youtube', 'spotify', 'twitch', 'tiktok', 'steam', 'x'] as const
export type Brand = (typeof BRANDS)[number]

export function BrandIcon({ name, className }: { name: string; className?: string }) {
  if (!BRANDS.includes(name as Brand)) return null
  if (MONO.has(name)) {
    return (
      <span
        aria-hidden="true"
        className={cn('inline-block size-5 shrink-0 bg-current', className)}
        style={{ maskImage: `url(/brands/${name}.svg)`, WebkitMaskImage: `url(/brands/${name}.svg)`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
      />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/brands/${name}.svg`} alt="" aria-hidden="true" className={cn('size-5 shrink-0 object-contain', className)} />
}
