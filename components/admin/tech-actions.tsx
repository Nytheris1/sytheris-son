'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { purgeCache } from '@/app/admin/actions'

export function TechActions() {
  const [pending, start] = useTransition()
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await purgeCache()
            toast.success('Önbellek temizlendi, sayfalar yeniden oluşturulacak')
          })
        }
        className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        Önbelleği temizle
      </button>
    </div>
  )
}