'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FloatingInstall() {
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

  if (!supportsPWA || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 rounded-2xl bg-neutral-900/95 p-2 pr-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-neutral-700/50 backdrop-blur-md"
      >
        {/* Kapatma Butonu */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-600 transition"
          aria-label="Kapat"
        >
          <X className="size-3" />
        </button>

        {/* İkon */}
        <div className="flex size-12 items-center justify-center rounded-xl bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          <Download className="size-6 text-white animate-pulse" />
        </div>

        {/* Metin ve Yükle Butonu */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Sytheris App</span>
          <button
            onClick={handleInstallClick}
            className="mt-0.5 text-sm font-bold text-white hover:text-red-400 transition-colors flex items-center gap-1"
          >
            Uygulamayı Yükle →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}