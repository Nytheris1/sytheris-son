'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function Intro({ covers, enabled }: { covers: string[]; enabled: boolean }) {
  const [show, setShow] = useState(true)
  const [ready, setReady] = useState(false)
  const [pct, setPct] = useState(0)
  const [time, setTime] = useState('')

  // Görselleri 3 eşit sütuna böl
  const col1 = covers.filter((_, i) => i % 3 === 0).slice(0, 6)
  const col2 = covers.filter((_, i) => i % 3 === 1).slice(0, 6)
  const col3 = covers.filter((_, i) => i % 3 === 2).slice(0, 6)

  useEffect(() => {
    const seen = document.documentElement.classList.contains('intro-seen')
    if (!enabled || seen) {
      setShow(false)
      return
    }
    setReady(true)
    document.body.style.overflow = 'hidden'
    
    // Yükleme simülasyonu
    const start = performance.now()
    const total = 3800
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const done = window.setTimeout(() => finish(), total + 400)

    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', keys)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(done)
      window.removeEventListener('keydown', keys)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    if (!ready) return
    const fmt = () => setTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
    fmt()
    const id = window.setInterval(fmt, 1000)
    return () => window.clearInterval(id)
  }, [ready])

  function finish() {
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    document.body.style.overflow = ''
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="sy-intro"
          key="intro"
          className="dark fixed inset-0 z-[100] overflow-hidden bg-[#0a0a0a] text-[#ededed]"
          exit={{ y: '-100%' }}
          initial={{ y: 0 }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          suppressHydrationWarning
        >
          {/* Film Grain Dokusu */}
          <div 
            className="pointer-events-none absolute inset-0 z-50 opacity-[0.15] mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
          />

          {/* Arka Plan Görselleri (Sonsuz Kayan 3 Sütun) */}
          <div className="absolute inset-0 z-0 flex gap-4 opacity-40">
            {[col1, col2, col3].map((col, i) => (
              <div key={i} className="flex h-full flex-1 flex-col gap-4">
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: ['0%', '-50%'] }}
                  transition={{ duration: 25 + i * 5, ease: 'linear', repeat: Infinity }}
                  className="flex flex-col gap-4"
                >
                  {[...col, ...col].map((src, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      key={j} 
                      src={src || '/placeholder.svg'} 
                      alt="" 
                      className="aspect-[2/3] w-full rounded-md object-cover" 
                    />
                  ))}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Ekranın Ortasını Karartma (Yazı okunsun diye) */}
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px]" />

          {/* İçerik (UI) */}
          <div className="relative z-20 flex h-full flex-col justify-between p-6 sm:p-10">
            
            {/* Üst Bilgi */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
              <span className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                Sytheris / Editoryal Seçki
              </span>
              <span className="hidden sm:inline">Türkiye · {time}</span>
              <span>v4.0</span>
            </div>

            {/* Orta Kısım: Devasa Tipografi */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden">
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="flex flex-col"
              >
                <p className="mb-4 text-center font-serif text-xl italic text-white/70 sm:text-3xl lg:text-4xl">
                  "Bir sonraki hikayen burada."
                </p>
                
                {/* Devasa SYTHERIS Yazısı */}
                <div className="relative flex w-full items-center justify-center">
                  <span className="block whitespace-nowrap text-center font-sans text-[18vw] font-black uppercase leading-[0.75] tracking-tighter text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.9)' }}>
                    SYTHERIS
                  </span>
                  {/* Yazının üzerinden geçen renkli animasyon (Tema rengi) */}
                  <motion.span 
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 1 }}
                    className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-center font-sans text-[18vw] font-black uppercase leading-[0.75] tracking-tighter text-white mix-blend-difference"
                  >
                    SYTHERIS
                  </motion.span>
                </div>
              </motion.div>
            </div>

            {/* Alt Kısım: Progress ve Buton */}
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                  {/* Progress Bar */}
                  <div className="relative h-12 w-[1px] bg-white/20 overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-white transition-all duration-100 ease-linear"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-2xl tabular-nums tracking-tighter sm:text-4xl">
                    {String(pct).padStart(3, '0')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className="group flex items-center gap-4 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-105 sm:px-8 sm:py-4"
                >
                  Keşfetmeye Başla
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              
              <div className="flex justify-between border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <span>Yükleniyor</span>
                <span className="hidden sm:inline">Görseller: AniList</span>
                <span>{String(pct).padStart(3, '0')} / 100</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}