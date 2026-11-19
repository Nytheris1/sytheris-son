'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Download, Loader2, RotateCcw, Trash2, Upload, XCircle } from 'lucide-react'
import { DEFAULT_PREFS, resetPrefs, setPrefs, usePrefs, type Prefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { ThemePanel } from '@/components/shell/theme-picker'
import { LANGS as SYNOPSIS_LANGS } from '@/components/anime/detail/synopsis'

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6 py-4">
      <span>
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute left-1 top-1 size-5 rounded-full bg-card shadow-[0_2px_6px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)]', checked && 'translate-x-5')} />
      </button>
    </label>
  )
}

export function Card({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_1px_0_rgb(0_0_0/0.02)] sm:p-7">
      <h2 className="mb-2 flex flex-wrap items-baseline gap-x-2 text-lg font-semibold tracking-tight sm:text-xl">
        {title} {accent && <span className="accent-serif text-2xl">{accent}</span>}
      </h2>
      {children}
    </section>
  )
}

export type SettingsSection = 'appearance' | 'access' | 'playback' | 'ai' | 'data'

const SHORTCUTS: [string, string][] = [
  ['Ctrl K  veya  /', 'Arama penceresini aç'],
  ['Esc', 'Açık pencereyi ya da menüyü kapat'],
  ['Boşluk / K', 'Oynatıcıda oynat / duraklat'],
  ['← / →', '5 saniye geri / ileri'],
  ['J / L', '10 saniye geri / ileri'],
  ['↑ / ↓', 'Ses seviyesi'],
  ['M', 'Sesi kapat / aç'],
  ['C', 'Altyazıyı aç / kapat'],
  ['F', 'Tam ekran'],
]

export function SettingsPanel({ only }: { only?: SettingsSection }) {
  const show = (s: SettingsSection) => !only || only === s
  const prefs = usePrefs()
  const [test, setTest] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [models, setModels] = useState<string[]>([])

  async function testOllama() {
    setTest('loading')
    try {
      const res = await fetch(`${prefs.ollamaUrl.replace(/\/$/, '')}/api/tags`)
      const json = (await res.json()) as { models?: { name: string }[] }
      setModels(json.models?.map((m) => m.name) ?? [])
      setTest('ok')
    } catch {
      setTest('fail')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {show('appearance') && (
        <Card title="Tema ve" accent="görünüm">
          <p className="mb-5 text-sm text-muted-foreground">Bir renk seç; tüm vurgular, butonlar ve kapak efektleri bu renge göre değişir.</p>
          <ThemePanel />
          <div className="mt-4 divide-y divide-border border-t border-border">
            <Toggle checked={prefs.intro} onChange={(v) => setPrefs({ intro: v })} label="Açılış animasyonu" description="Siteye her yeni oturumda girişte intro göster." />
          </div>
        </Card>
      )}

      {show('access') && (
        <Card title="Okunabilirlik ve" accent="odak">
          <div className="divide-y divide-border">
            <Toggle checked={prefs.reduceMotion} onChange={(v) => setPrefs({ reduceMotion: v })} label="Hareketi azalt" description="Animasyonları ve sayfa geçişlerini en aza indir." />
            <Toggle checked={prefs.strongFocus} onChange={(v) => setPrefs({ strongFocus: v })} label="Belirgin odak çerçevesi" description="Klavyeyle gezinirken seçili öğenin etrafına kalın, renkli bir çerçeve çiz." />
            <Toggle checked={prefs.underlineLinks} onChange={(v) => setPrefs({ underlineLinks: v })} label="Metin içi bağlantıların altını çiz" description="Paragraflardaki bağlantılar renk dışında da ayırt edilebilsin." />
            <Toggle checked={prefs.hideScores} onChange={(v) => setPrefs({ hideScores: v })} label="Kartlarda puanları gizle" description="Önyargısız keşif için kapak kartlarındaki puan rozetlerini kaldır." />
          </div>
        </Card>
      )}

      {show('access') && (
        <Card title="Yazı" accent="boyutu">
          <p className="mb-5 text-sm text-muted-foreground">Sitenin tamamındaki metin ve boşlukları birlikte ölçekler. Okuma rahatlığına göre seç.</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Yazı boyutu">
            {(
              [
                ['sm', 'Küçük', 'text-sm'],
                ['md', 'Normal', 'text-base'],
                ['lg', 'Büyük', 'text-lg'],
                ['xl', 'Çok büyük', 'text-xl'],
              ] as const
            ).map(([id, label, size]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={prefs.textScale === id}
                onClick={() => setPrefs({ textScale: id })}
                className={cn('flex flex-col items-center gap-1 rounded-2xl border py-3 transition', prefs.textScale === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
              >
                <span className={cn('font-semibold leading-none', size)}>Aa</span>
                <span className="text-[11px] opacity-80">{label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {show('access') && (
        <Card title="Klavye" accent="kısayolları">
          <dl className="mt-3 divide-y divide-border">
            {SHORTCUTS.map(([keys, what]) => (
              <div key={keys} className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">{what}</dt>
                <dd>
                  <kbd className="whitespace-nowrap rounded-lg border border-border bg-muted px-2 py-1 font-mono text-xs">{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {show('playback') && (
        <Card title="Oynatma ve" accent="fragmanlar">
          <div className="divide-y divide-border">
            <Toggle checked={prefs.autoplayTrailers} onChange={(v) => setPrefs({ autoplayTrailers: v })} label="Fragmanları otomatik oynat" description="Kapakların üzerinde beklediğinde ve hero alanında fragman sessizce oynatılır." />
            <Toggle checked={prefs.trailerSound} onChange={(v) => setPrefs({ trailerSound: v })} label="Fragman sesi" description="Önizleme fragmanlarını sesli başlat." />
            <Toggle checked={prefs.resumePlayback} onChange={(v) => setPrefs({ resumePlayback: v })} label="Kaldığım yerden devam et" description="Bir bölümü yarıda bıraktığında, tekrar açınca son saniyeden başlat." />
            <Toggle checked={prefs.dataSaver} onChange={(v) => setPrefs({ dataSaver: v })} label="Veri tasarrufu" description="Mobil veride fragmanları hiç yükleme ve ağır bulanıklık efektlerini kapat." />
          </div>
          <div className="mt-2 border-t border-border pt-5">
            <p className="font-medium">Varsayılan oynatma hızı</p>
            <p className="mb-3 mt-0.5 text-sm text-muted-foreground">Her bölüm bu hızla başlar; oynatıcıdan anlık değiştirebilirsin.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Varsayılan oynatma hızı">
              {[0.75, 1, 1.25, 1.5, 1.75, 2].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={prefs.defaultSpeed === v}
                  onClick={() => setPrefs({ defaultSpeed: v })}
                  className={cn('rounded-2xl border py-2.5 font-mono text-sm transition', prefs.defaultSpeed === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
                >
                  {v}x
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {show('playback') && (
        <Card title="Özet" accent="dili">
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Anime detay sayfalarındaki hikâye özeti bu dilde gösterilir. Detay sayfasından da anında değiştirebilirsin.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Özet dili">
            {SYNOPSIS_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={prefs.synopsisLang === l.id}
                onClick={() => setPrefs({ synopsisLang: l.id })}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2.5 text-left transition',
                  prefs.synopsisLang === l.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary',
                )}
              >
                <span className="text-sm font-semibold">{l.label}</span>
                <span className="font-mono text-[10px] uppercase opacity-60">{l.short}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {show('playback') && (
      <Card title="Altyazı" accent="stili">
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-4 gap-2">
            {(['sm', 'md', 'lg', 'xl'] as Prefs['subtitleSize'][]).map((s) => (
              <button key={s} type="button" aria-pressed={prefs.subtitleSize === s} onClick={() => setPrefs({ subtitleSize: s })} className={cn('rounded-2xl border py-3 font-mono text-sm uppercase transition', prefs.subtitleSize === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}>
                {s}
              </button>
            ))}
          </div>
          <div className="dark grid aspect-[21/6] place-items-end justify-center rounded-2xl bg-scrim p-4">
            <span className={cn('text-center font-semibold text-on-scrim', prefs.subtitleBg ? 'rounded-md bg-black/70 px-3 py-1' : '[text-shadow:0_2px_4px_#000]', { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' }[prefs.subtitleSize])}>
              Bu bir altyazı önizlemesidir.
            </span>
          </div>
          <Toggle checked={prefs.subtitleBg} onChange={(v) => setPrefs({ subtitleBg: v })} label="Altyazı arka planı" />
        </div>
      </Card>
      )}

      {show('ai') && (
      <Card title="Yapay zekâ" accent="asistanı">
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Sytheris AI önce bilgisayarındaki Ollama&apos;yı dener; erişemezse sunucudaki Gemini API&apos;ye geçer. Ollama&apos;nın siteye erişebilmesi için Ollama&apos;yı{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">OLLAMA_ORIGINS=*</code> ortam değişkeniyle başlatman gerekir.
        </p>
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Sağlayıcı">
          {(
            [
              ['auto', 'Otomatik'],
              ['ollama', 'Önce Ollama'],
              ['gemini', 'Yalnız Gemini'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={prefs.aiProvider === v} onClick={() => setPrefs({ aiProvider: v })} className={cn('rounded-xl py-2.5 text-sm font-medium transition', prefs.aiProvider === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Ollama adresi</span>
            <input value={prefs.ollamaUrl} onChange={(e) => setPrefs({ ollamaUrl: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Model</span>
            {models.length ? (
              <select value={prefs.ollamaModel} onChange={(e) => setPrefs({ ollamaModel: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary">
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input value={prefs.ollamaModel} onChange={(e) => setPrefs({ ollamaModel: e.target.value })} className="h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary" />
            )}
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={testOllama} className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary">
            {test === 'loading' && <Loader2 className="size-4 animate-spin" />}
            Bağlantıyı test et
          </button>
          {test === 'ok' && (
            <span className="flex items-center gap-1.5 text-sm text-ink">
              <CheckCircle2 className="size-4" /> Ollama bağlı · {models.length} model
            </span>
          )}
          {test === 'fail' && (
            <span className="flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="size-4" /> Ulaşılamadı — bulut yanıtı kullanılacak
            </span>
          )}
        </div>
      </Card>
      )}

      {show('data') && <DataCard />}
    </div>
  )
}

const LOCAL_KEYS = {
  playlist: ['sy-playlist', 'sy-volume'],
  progress: 'sy-pos-',
}

function DataCard() {
  const file = useRef<HTMLInputElement>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  function exportPrefs() {
    const data = {
      app: 'sytheris',
      version: 1,
      exportedAt: new Date().toISOString(),
      prefs: JSON.parse(localStorage.getItem('sy-prefs') || '{}'),
      theme: localStorage.getItem('sy-theme'),
      mode: localStorage.getItem('sy-mode'),
      customTheme: localStorage.getItem('sy-custom-theme'),
      playlist: JSON.parse(localStorage.getItem('sy-playlist') || '[]'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sytheris-ayarlar.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Ayarların indirildi')
  }

  async function importPrefs(f: File) {
    try {
      const data = JSON.parse(await f.text())
      if (data?.app !== 'sytheris' || typeof data.prefs !== 'object') throw new Error()
      const allowed = Object.keys(DEFAULT_PREFS)
      const prefs = Object.fromEntries(Object.entries(data.prefs).filter(([k]) => allowed.includes(k))) as Partial<Prefs>
      setPrefs(prefs)
      if (typeof data.theme === 'string') localStorage.setItem('sy-theme', data.theme)
      if (data.mode === 'light' || data.mode === 'dark' || data.mode === 'system') localStorage.setItem('sy-mode', data.mode)
      if (typeof data.customTheme === 'string') localStorage.setItem('sy-custom-theme', data.customTheme)
      if (Array.isArray(data.playlist)) localStorage.setItem('sy-playlist', JSON.stringify(data.playlist.slice(0, 100)))
      toast.success('Ayarlar geri yüklendi', { description: 'Tema ve müzik listesi sayfa yenilenince uygulanır.' })
      window.setTimeout(() => window.location.reload(), 900)
    } catch {
      toast.error('Bu dosya bir Sytheris yedeği değil')
    }
  }

  function clearProgress() {
    let n = 0
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(LOCAL_KEYS.progress)) {
        localStorage.removeItem(k)
        n++
      }
    }
    toast.success(n ? `${n} bölümün izleme konumu silindi` : 'Silinecek izleme konumu yok')
  }

  function clearPlaylist() {
    LOCAL_KEYS.playlist.forEach((k) => localStorage.removeItem(k))
    toast.success('Müzik listen temizlendi', { description: 'Sayfa yenilenince boş başlar.' })
  }

  function wipe() {
    for (const k of Object.keys(localStorage)) if (k.startsWith('sy-')) localStorage.removeItem(k)
    try {
      sessionStorage.clear()
    } catch {}
    resetPrefs()
    toast.success('Bu cihazdaki tüm Sytheris verileri silindi')
    window.setTimeout(() => (window.location.href = '/'), 800)
  }

  const btn = 'flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary'

  return (
    <>
      <Card title="Yedekle ve" accent="taşı">
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Tema, oynatma tercihleri ve müzik listen bu cihazda saklanır. Bir dosyaya yedekleyip başka bir cihazda geri yükleyebilirsin.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportPrefs} className={btn}>
            <Download className="size-4" aria-hidden="true" /> Ayarları dışa aktar
          </button>
          <button type="button" onClick={() => file.current?.click()} className={btn}>
            <Upload className="size-4" aria-hidden="true" /> Yedekten geri yükle
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importPrefs(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => {
              resetPrefs()
              toast.success('Tercihler varsayılana döndü')
            }}
            className={btn}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Tercihleri sıfırla
          </button>
        </div>
      </Card>

      <Card title="Cihaz" accent="temizliği">
        <div className="divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <span>
              <span className="block font-medium">İzleme konumları</span>
              <span className="block text-sm text-muted-foreground">Yarıda bıraktığın bölümlerin kaldığı saniyeler.</span>
            </span>
            <button type="button" onClick={clearProgress} className={btn}>
              Temizle
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <span>
              <span className="block font-medium">Müzik listesi</span>
              <span className="block text-sm text-muted-foreground">Çalma sıran ve ses seviyesi.</span>
            </span>
            <button type="button" onClick={clearPlaylist} className={btn}>
              Temizle
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <span>
              <span className="block font-medium text-destructive">Her şeyi sil</span>
              <span className="block text-sm text-muted-foreground">Bu cihazdaki tüm Sytheris tercih ve verilerini kaldırır. Hesabın etkilenmez.</span>
            </span>
            {confirmWipe ? (
              <span className="flex gap-2">
                <button type="button" onClick={() => setConfirmWipe(false)} className={btn}>
                  Vazgeç
                </button>
                <button type="button" onClick={wipe} className="flex h-11 items-center gap-2 rounded-full bg-destructive px-5 text-sm font-semibold text-background transition hover:brightness-110">
                  <Trash2 className="size-4" aria-hidden="true" /> Evet, sil
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmWipe(true)} className="flex h-11 items-center gap-2 rounded-full border border-destructive/40 px-5 text-sm font-medium text-destructive transition hover:bg-destructive/10">
                <Trash2 className="size-4" aria-hidden="true" /> Sil
              </button>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
