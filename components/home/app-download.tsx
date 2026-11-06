'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

export function AppDownload() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Uygulama zaten yüklü mü kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!promptInstall) {
      alert("Uygulamayı yüklemek için tarayıcınızın menüsünden 'Ana Ekrana Ekle' veya 'Uygulamayı Yükle' seçeneğini kullanın.");
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setPromptInstall(null);
    });
  };

  if (isInstalled) return null; // Zaten yüklüyse banner'ı gösterme

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 my-16 mx-auto max-w-7xl">
      {/* Arka plan süslemeleri */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-600/20 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-600/20 blur-[100px]" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
        
        {/* Sol Taraf: Metin */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 text-red-500 text-sm font-semibold mb-6 border border-red-600/20">
            <Smartphone className="w-4 h-4" />
            <span>Yeni Nesil Anime Deneyimi</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Sytheris'i <span className="text-red-500">Cebine İndir</span>
          </h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl">
            Reklamsız, hızlı ve kesintisiz anime keyfi. Uygulamamızı telefonunuza veya bilgisayarınıza yükleyin, favori animelerinize her yerden ulaşın.
          </p>

          {/* Butonlar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button 
              onClick={handleInstallClick}
              className="group flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" />
              <div className="text-left">
                <span className="block text-xs font-normal text-red-200">Hemen</span>
                <span className="text-lg leading-none">İndir / Yükle</span>
              </div>
            </button>
            
            <button 
              onClick={() => alert("iOS için: Safari'nin altındaki 'Paylaş' butonuna tıklayıp 'Ana Ekrana Ekle' seçeneğini kullanın.")}
              className="flex items-center gap-3 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all"
            >
              <Monitor className="w-6 h-6" />
              <div className="text-left">
                <span className="block text-xs font-normal text-neutral-400">iOS / Apple</span>
                <span className="text-lg leading-none">Nasıl Yapılır?</span>
              </div>
            </button>
          </div>
          
          <div className="mt-6 flex items-center justify-center md:justify-start gap-2 text-sm text-neutral-500">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Tamamen ücretsizdir, yer kaplamaz.</span>
          </div>
        </div>

        {/* Sağ Taraf: Görsel / Mockup */}
        <div className="hidden lg:flex relative w-80 h-96 items-center justify-center">
          {/* Telefon Çerçevesi (CSS Mockup) */}
          <div className="w-64 h-[500px] bg-black border-[8px] border-neutral-800 rounded-[3rem] shadow-2xl relative overflow-hidden rotate-12 hover:rotate-0 transition-transform duration-500">
            {/* Ekran İçeriği */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black p-4 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-600/40">
                <span className="text-3xl font-black text-white">S</span>
              </div>
              <h3 className="text-white font-bold text-xl">Sytheris</h1>
              <p className="text-neutral-500 text-sm mt-2">Anime Dünyası</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}