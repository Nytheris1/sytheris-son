'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { saveSiteSettings } from '@/app/admin/actions'
import type { SiteSettings } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Card, Toggle } from '@/components/settings/settings-panel'
import { AnimePicker } from '@/components/compare/compare-picker'

const field = 'h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary'

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState(initial)
  const [featured, setFeatured] = useState<{ id: number; title: string } | null>(initial.featuredId ? { id: initial.featuredId, title: `#${initial.featuredId}` } : null)
  const [pending, start] = useTransition()
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }))

  const save = () =>
    start(async () => {
      try {
        await saveSiteSettings({ ...s, featuredId: featured?.id ?? null })
        toast.success('Ayarlar kaydedildi')
      } catch (e) {
        toast.error((e as Error).message)
      }
    })

  return (
    <div className="flex flex-col gap-6">
      <Card title="Bakım" accent="modu">
        <div className={cn('mt-4 rounded-2xl border p-4 transition', s.maintenance ? 'border-destructive/50 bg-destructive/10' : 'border-border')}>
          <Toggle checked={s.maintenance} onChange={(v) => set('maintenance', v)} label="Siteyi bakıma al" description="Açıkken ziyaretçiler bakım ekranını görür. Yöneticiler siteyi normal görmeye devam eder." />
        </div>
        <div className="mt-4 grid gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Başlık</span>
            <input className={field} value={s.maintenanceTitle} onChange={(e) => set('maintenanceTitle', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Mesaj</span>
            <textarea className="min-h-24 rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary" value={s.maintenanceMessage} onChange={(e) => set('maintenanceMessage', e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Tahmini dönüş (ör. “Bugün 18:00”)</span>
            <input className={field} value={s.maintenanceEta} onChange={(e) => set('maintenanceEta', e.target.value)} />
          </label>
        </div>
      </Card>

      <Card title="Duyuru" accent="çubuğu">
        <div className="mt-4 grid gap-4">
          <input className={field} placeholder="Boş bırakırsan duyuru gösterilmez" value={s.announcement} onChange={(e) => set('announcement', e.target.value)} />
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
            {(['info', 'success', 'warning'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={s.announcementTone === t} onClick={() => set('announcementTone', t)} className={cn('rounded-xl py-2 text-sm transition', s.announcementTone === t ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
                {t === 'info' ? 'Bilgi' : t === 'success' ? 'Başarı' : 'Uyarı'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Ana sayfa ve" accent="özellikler">
        <div className="mt-2 divide-y divide-border">
          <Toggle checked={s.introEnabled} onChange={(v) => set('introEnabled', v)} label="Açılış animasyonu" description="Yeni ziyaretçilere intro ekranı gösterilir." />
          <Toggle checked={s.registrationsOpen} onChange={(v) => set('registrationsOpen', v)} label="Yeni kayıtlar" description="E-posta ile yeni hesap oluşturulabilir." />
          <Toggle checked={s.aiEnabled} onChange={(v) => set('aiEnabled', v)} label="Sytheris AI" description="Yapay zekâ asistanı sitede görünür." />
        </div>
        <div className="mt-4 flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Haftanın seçkisi (boş bırakılırsa otomatik)</span>
          <AnimePicker label="Anime ara" value={featured} onPick={(m) => setFeatured(m ? { id: m.id, title: m.title.english || m.title.romaji || `#${m.id}` } : null)} />
        </div>
      </Card>

      <button type="button" onClick={save} disabled={pending} className="sticky bottom-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-xl transition hover:brightness-110 disabled:opacity-70">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Ayarları kaydet
      </button>
    </div>
  )
}
