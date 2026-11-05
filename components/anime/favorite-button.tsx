'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFavorite } from '@/app/actions/favorites'
import { cn } from '@/lib/utils'

export function FavoriteButton({ animeId, initial, loggedIn, className }: { animeId: number; initial: boolean; loggedIn: boolean; className?: string }) {
  const [fav, setFav] = useState(initial)
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      aria-pressed={fav}
      disabled={pending}
      onClick={() => {
        if (!loggedIn) {
          toast('Favorilere eklemek için giriş yap', { action: { label: 'Giriş yap', onClick: () => router.push('/giris') } })
          return
        }
        setFav((v) => !v)
        start(async () => {
          const res = await toggleFavorite(animeId)
          if (!res.ok) {
            setFav((v) => !v)
            toast.error('İşlem başarısız oldu')
          } else toast.success(res.favorite ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı')
        })
      }}
      className={cn(
        'flex h-13 items-center gap-2 rounded-full border px-5 font-medium backdrop-blur transition',
        fav ? 'border-primary bg-primary/15 text-primary' : 'border-foreground/25 hover:bg-foreground/10',
        className,
      )}
    >
      <Heart className={cn('size-4 transition', fav && 'scale-110 fill-current')} />
      {fav ? 'Favorilerde' : 'Favorilere ekle'}
    </button>
  )
}
