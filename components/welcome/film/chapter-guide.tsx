'use client'

import { AnimatePresence, motion } from 'motion/react'
import { THEMES, type ThemeId } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { mascotTheme } from '@/components/mascot/mascot-config'

const OUT = [0.16, 1, 0.3, 1] as const

const LINES: Record<ThemeId, { jp: string; say: string }> = {
  green: { jp: '新緑', say: 'Yeşil kapak, taze bir sezon. Hadi keşfe çıkalım!' },
  red: { jp: '反逆', say: 'Kırmızı mı? Shounen ruhu seni çağırıyor.' },
  blue: { jp: '深淵', say: 'Mavi… derin bir hikâyeye hazır mısın?' },
  gold: { jp: '運命', say: 'Altın baskı! Efsanevi seriler seni bekliyor.' },
  sakura: { jp: '桜', say: 'Sakura rengi… romantik bir sezon olacak.' },
  mono: { jp: '墨', say: 'Siyah beyaz. Tıpkı ilk manga baskıları gibi.' },
}

/**
 * Chapter 04 — Character. Syra, the guide, in every colourway of the site.
 * Picking one re-themes the whole site on the spot, so the choice carries into the home page.
 */
export function ChapterGuide({ name }: { name: string | null }) {
  const { theme, setTheme } = useTheme()
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  const line = LINES[current.id]

  return (
    <section id="karakter" aria-labelledby="guide-title" className="relative isolate overflow-hidden bg-on-scrim py-24 text-scrim sm:py-32">

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-6 sm:px-10">
        <div className="flex flex-col items-start gap-1.5">
          <h2 id="guide-title" lang="en" className="text-[clamp(40px,5vw,64px)] font-black uppercase leading-none tracking-[-0.02em]">
            Character
          </h2>
        </div>

        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative aspect-square w-full">
            <span aria-hidden="true" className="absolute inset-x-[10%] bottom-0 top-[18%] -z-10 bg-primary/90 [clip-path:polygon(18%_0,100%_0,82%_100%,0_100%)]" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={current.id}
                src={mascotTheme(current.id)}
                alt={`Syra, ${current.name} renginde`}
                initial={{ opacity: 0, x: 60, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -60, filter: 'blur(10px)' }}
                transition={{ duration: 0.7, ease: OUT }}
                className="absolute inset-0 size-full object-contain object-bottom drop-shadow-[0_30px_40px_rgb(0_0_0/0.25)]"
              />
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={current.id}
                role="status"
                initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: -3 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className="absolute left-0 top-[4%] max-w-[min(260px,60%)] rounded-[1.2rem] rounded-bl-sm border-2 border-scrim bg-scrim px-4 py-3 text-sm font-medium leading-relaxed text-on-scrim shadow-[5px_5px_0_var(--primary)]"
              >
                {name && current.id === theme ? `${name}, ` : ''}
                {line.say}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-8 pb-4">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-scrim/55">Rehberin</p>
              <p className="text-[clamp(56px,8vw,120px)] font-black uppercase leading-[0.8] tracking-[-0.06em]" lang="en">
                Syra
              </p>
              <p className="max-w-md text-pretty leading-relaxed text-scrim/70">
                Sytheris’in editörü ve rehberi. Sana öneri yapar, kaybolduğunda yolu gösterir, gece yarısı sinemasının ışıklarını kısar. Bir kapak rengi seç — site de onunla birlikte değişsin.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-scrim/55">Kapak rengi · {current.name}</p>
              <div role="radiogroup" aria-label="Site rengi" className="grid grid-cols-6 gap-2">
                {THEMES.map((t) => {
                  const on = t.id === theme
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={t.name}
                      title={t.name}
                      onClick={(e) => setTheme(t.id, { x: e.clientX, y: e.clientY })}
                      className={cn(
                        'group relative aspect-[3/4] overflow-hidden border-2 outline-none transition focus-visible:ring-2 focus-visible:ring-scrim focus-visible:ring-offset-2 focus-visible:ring-offset-on-scrim',
                        on ? 'border-scrim' : 'border-scrim/10 hover:border-scrim/50',
                      )}
                      style={{ background: t.swatch }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mascotTheme(t.id)} alt="" loading="lazy" className="absolute inset-x-0 bottom-0 h-[115%] w-full object-cover object-top transition duration-500 group-hover:scale-110" />
                      {on && <motion.span layoutId="guide-pick" className="absolute inset-x-0 bottom-0 h-1.5 bg-scrim" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
