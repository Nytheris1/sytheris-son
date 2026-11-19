'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { EyeOff, Flag, Heart, ImagePlay, Loader2, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMyComment, likeComment, postComment, reportContent } from '@/app/actions/community'
import { commentInk, commentInkClass, commentInkStyle, type BadgeId, type CommentColor } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { NamePlate } from '@/components/membership/nameplate'
import { BadgeRow } from '@/components/membership/badge-icon'
import { Mascot } from '@/components/mascot/mascot'
import { GifPicker } from './gif-picker'

export type CommentView = {
  id: string
  text: string
  gif?: string | null
  spoiler: boolean
  at: number
  likes: number
  liked: boolean
  mine: boolean
  author: { username: string; displayName: string; avatar?: string | null; frame?: string | null; badges: BadgeId[]; nameStyle?: string | null; commentColor?: CommentColor; nameplate?: string | null } | null
}

const REASONS = ['Spoiler', 'Hakaret / taciz', 'Spam', 'Uygunsuz içerik']

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'az önce'
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function CommentItem({ c, animeId }: { c: CommentView; animeId: number }) {
  const [revealed, setRevealed] = useState(!c.spoiler)
  const [liked, setLiked] = useState(c.liked)
  const [likes, setLikes] = useState(c.likes)
  const [reporting, setReporting] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  const ink = commentInk(c.author?.commentColor)

  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-4 rounded-3xl border border-border bg-card p-5">
      {c.author ? (
        <Link href={`/u/${c.author.username}`} className="shrink-0">
          <AvatarFrame src={c.author.avatar} name={c.author.displayName} frame={c.author.frame} className="size-11" />
        </Link>
      ) : (
        <span className="size-11 shrink-0 rounded-full bg-muted" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {c.author ? (
            <Link href={`/u/${c.author.username}`} className="font-semibold transition hover:opacity-80">
              <NamePlate plate={c.author.nameplate}>{c.author.displayName}</NamePlate>
            </Link>
          ) : (
            <span className="font-semibold text-muted-foreground">Silinmiş kullanıcı</span>
          )}
          {c.author && <BadgeRow ids={c.author.badges} size="xs" max={3} />}
          <span className="font-mono text-[11px] text-muted-foreground">{ago(c.at)}</span>
          {c.spoiler && <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">Spoiler</span>}
        </div>
        <div className="relative">
          <div className={cn('relative flex flex-col gap-2 transition', ink && 'pl-3.5', !revealed && 'select-none blur-md')} style={commentInkStyle(c.author?.commentColor)}>
            {ink && <span aria-hidden="true" className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-[linear-gradient(180deg,var(--ink-a),var(--ink-b))]" />}
            {c.text && (
              <p className="whitespace-pre-line text-pretty leading-relaxed text-foreground/85">
                <span className={commentInkClass(c.author?.commentColor)}>{c.text}</span>
              </p>
            )}
            {c.gif && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.gif} alt="Yoruma eklenen GIF" loading="lazy" className="max-h-56 w-auto max-w-full rounded-xl object-contain" />
            )}
          </div>
          {!revealed && (
            <button type="button" onClick={() => setRevealed(true)} className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium">
              <EyeOff className="size-4" /> Spoiler içeriyor — göster
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 pt-1">
          <button
            type="button"
            aria-pressed={liked}
            onClick={() =>
              start(async () => {
                const res = await likeComment(animeId, c.id)
                if (!res.ok) {
                  toast(res.error, { action: { label: 'Giriş yap', onClick: () => router.push('/giris') } })
                  return
                }
                setLiked(res.liked)
                setLikes(res.count)
              })
            }
            className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition hover:bg-muted', liked && 'text-primary')}
          >
            <Heart className={cn('size-3.5', liked && 'fill-current')} />
            {likes}
          </button>
          {c.mine ? (
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  const res = await deleteMyComment(animeId, c.id)
                  if (!res.ok) toast.error(res.error)
                  else router.refresh()
                })
              }
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> Sil
            </button>
          ) : (
            <button type="button" onClick={() => setReporting((v) => !v)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted">
              <Flag className="size-3.5" /> Bildir
            </button>
          )}
          {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        <AnimatePresence>
          {reporting && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-2 overflow-hidden">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    start(async () => {
                      const res = await reportContent({ kind: 'comment', targetId: c.id, animeId, reason: r, snapshot: c.text })
                      setReporting(false)
                      if (res.ok) toast.success('Bildirimin ekibe iletildi. Teşekkürler!')
                      else toast.error(res.error)
                    })
                  }
                  className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-destructive hover:text-destructive"
                >
                  {r}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  )
}

export function Comments({
  animeId,
  animeTitle,
  comments,
  viewer,
}: {
  animeId: number
  animeTitle: string
  comments: CommentView[]
  viewer: { displayName: string; avatar?: string | null; frame?: string | null; nameStyle?: string | null; commentColor?: CommentColor } | null
}) {
  const [text, setText] = useState('')
  const [gif, setGif] = useState<string | null>(null)
  const [gifOpen, setGifOpen] = useState(false)
  const [spoiler, setSpoiler] = useState(false)
  const [pending, start] = useTransition()
  const [sort, setSort] = useState<'new' | 'top'>('new')
  const router = useRouter()
  const sorted = [...comments].sort((a, b) => (sort === 'new' ? b.at - a.at : b.likes - a.likes))

  const submit = () => {
    if (!text.trim() && !gif) return
    start(async () => {
      const res = await postComment(animeId, animeTitle, text, spoiler, gif)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setText('')
      setGif(null)
      setGifOpen(false)
      setSpoiler(false)
      toast.success('Yorumun yayında')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {viewer ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex gap-4 rounded-3xl border border-border bg-card p-5"
        >
          <AvatarFrame src={viewer.avatar} name={viewer.displayName} frame={viewer.frame} className="hidden size-11 sm:inline-grid" />
          <div className="flex flex-1 flex-col gap-3">
            <label htmlFor="comment" className="sr-only">
              Yorumun
            </label>
            <textarea
              id="comment"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
              }}
              maxLength={1200}
              rows={3}
              placeholder={`${animeTitle} hakkında ne düşünüyorsun?`}
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-primary"
            />
            {gif && (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gif} alt="Seçilen GIF" className="max-h-40 rounded-xl" />
                <button type="button" onClick={() => setGif(null)} aria-label="GIF’i kaldır" className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-scrim/80 text-on-scrim">
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            {gifOpen && (
              <GifPicker
                onPick={(url) => {
                  setGif(url)
                  setGifOpen(false)
                }}
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setGifOpen((v) => !v)}
                  aria-expanded={gifOpen}
                  className={cn('flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition', gifOpen ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
                >
                  <ImagePlay className="size-3.5" /> GIF
                </button>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                  Spoiler içeriyor
                </label>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-muted-foreground">{text.length}/1200</span>
                <button type="submit" disabled={pending || (text.trim().length < 2 && !gif)} className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4 rounded-3xl border border-dashed border-border p-5">
          <Mascot pose="bust" className="size-14 shrink-0" />
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">Sohbete katılmak ister misin? Giriş yap ve düşüncelerini paylaş.</p>
          <Link href="/giris" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground">
            Giriş yap
          </Link>
        </div>
      )}

      {comments.length > 1 && (
        <div className="flex gap-1 self-start rounded-full bg-muted p-1" role="radiogroup" aria-label="Sırala">
          {(
            [
              ['new', 'En yeni'],
              ['top', 'En beğenilen'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={sort === v} onClick={() => setSort(v)} className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition', sort === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
      )}

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Henüz yorum yok. İlk yorumu sen yaz!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {sorted.map((c) => (
              <CommentItem key={c.id} c={c} animeId={animeId} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
