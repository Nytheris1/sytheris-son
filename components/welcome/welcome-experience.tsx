'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { FilmBoot } from './film/film-boot'
import { ChapterOpen } from './film/chapter-open'
import { ChapterIntro } from './film/chapter-intro'
import { ChapterFeatures } from './film/chapter-features'
import { ChapterGuide } from './film/chapter-guide'
import { ChapterFinale } from './film/chapter-finale'

export const WELCOME_HANDOFF_KEY = 'sy-from-welcome'
const PANELS = 7

function jumpTo(id: string, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior) })
}

/**
 * /hosgeldin — the intro and the introduction are one continuous, scroll-driven film:
 *   boot slate → 01 3D cover tower → 02 Introduction → 03 System reel → 04 Character → curtain finale.
 * Leaving the film (finale, a CTA or a feature link) closes the curtain and the home page opens it again.
 */
export function WelcomeExperience({ covers, name }: { covers: string[]; name: string | null }) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    router.prefetch('/')
    // The film is offered once: leaving it any way (back button, logo, closing the tab) must not send the
    // visitor back here on their next visit to the home page.
    try {
      localStorage.setItem('sy-welcomed', '1')
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    document.documentElement.classList.add('intro-seen')
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    return () => {
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto'
    }
  }, [router])

  const go = useCallback(
    (href = '/') => {
      if (leaving) return
      try {
        localStorage.setItem('sy-welcomed', '1')
        sessionStorage.setItem('sy-intro-seen', '1')
        sessionStorage.setItem(WELCOME_HANDOFF_KEY, '1')
      } catch {}
      document.documentElement.classList.add('intro-seen')
      setLeaving(true)
      window.setTimeout(() => router.push(href), 650)
    },
    [leaving, router],
  )

  const skip = useCallback(() => jumpTo('tanitim', false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const intro = document.getElementById('tanitim')
      if (intro && window.scrollY < intro.offsetTop - 10) skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  return (
    <main className="relative isolate min-h-dvh overflow-x-clip bg-scrim">
      <FilmBoot />
      <ChapterOpen covers={covers} onSkip={skip} />
      <ChapterIntro onNavigate={(id) => jumpTo(id)} />
      <ChapterFeatures covers={covers} onGo={go} />
      <ChapterGuide name={name} />
      <ChapterFinale covers={covers} onEnter={go} signedIn={Boolean(name)} />

      <AnimatePresence>
        {leaving && (
          <motion.div aria-hidden="true" className="fixed inset-0 z-[150] flex" initial={{ opacity: 1 }}>
            {Array.from({ length: PANELS }, (_, i) => (
              <motion.span
                key={i}
                className="h-full flex-1 border-x border-scrim/30 bg-primary"
                initial={{ y: i % 2 ? '-101%' : '101%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.55, delay: Math.abs(i - (PANELS - 1) / 2) * 0.03, ease: [0.83, 0, 0.17, 1] }}
              />
            ))}
            <motion.p
              lang="en"
              className="absolute inset-0 flex items-center justify-center text-[clamp(56px,12vw,190px)] font-black uppercase tracking-[-0.06em] text-primary-foreground"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Sytheris
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sr-only" role="status" aria-live="polite">
        {leaving ? 'Ana sayfaya geçiliyor' : ''}
      </p>
    </main>
  )
}
