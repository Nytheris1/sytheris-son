'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FloatingInstall() {
  const pathname = usePathname() ?? '/';
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Eğer uygulama zaten yüklüyse hiç gösterme
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: any) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
      // Butonun görünmesi için ufak bir gecikme (sayfa yüklendikten 3 saniye sonra çıksın)
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setPromptInstall(null);
    });
  };

  // Full-screen tools (studio, download page) keep their corners free.
  if (!supportsPWA || !isVisible || pathname.startsWith('/atolye/studyo') || pathname.startsWith('/indir') || pathname.startsWith('/portfolyo') || pathname.startsWith('/kapi') || pathname.startsWith('/rehber')) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass fixed bottom-28 left-3 z-[65] flex items-center gap-3 rounded-2xl border border-border p-2 pr-4 shadow-2xl md:bottom-6 md:left-6"
      >
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-border bg-popover text-muted-foreground transition hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="size-3" />
        </button>

        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_18px_-4px_var(--primary)]">
          <Download className="size-6" />
        </div>

        <div className="flex flex-col">
          <span className="label-mono text-[9px] text-muted-foreground">Sytheris App</span>
          <button
            type="button"
            onClick={handleInstallClick}
            className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-ink"
          >
            Uygulamayı Yükle →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
