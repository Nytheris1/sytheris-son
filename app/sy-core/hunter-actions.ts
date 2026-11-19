'use server'

import { revalidatePath } from 'next/cache'
import { adminActor } from '@/lib/admin-guard'
import { audit } from '@/lib/community'
import { huntMedia, type HuntCandidate, type HuntResult } from '@/lib/media-hunter'
import { deleteVaultItem, getVaultItem, isHttpUrl, saveVaultItem, signedMediaPath, type MediaKind } from '@/lib/media-vault'
import { rateLimit } from '@/lib/rate-limit'
import { addEpisode } from '@/lib/site'

type Fail = { ok: false; error: string }
export type HuntCandidateView = HuntCandidate & { preview: string }
export type HuntResponse = (Omit<Extract<HuntResult, { ok: true }>, 'candidates'> & { candidates: HuntCandidateView[] }) | (Fail & { pages?: Extract<HuntResult, { ok: false }>['pages'] })

async function requireAdmin() {
  const actor = await adminActor()
  if (!actor) throw new Error('Yetkisiz işlem')
  return actor
}

export async function huntAction(rawUrl: string): Promise<HuntResponse> {
  try {
    const actor = await requireAdmin()
    const wait = rateLimit('media-hunt', actor, 12, 60_000)
    if (wait) return { ok: false, error: `Çok sık tarama yapıldı. ${wait} sn sonra tekrar dene.` }
    const url = String(rawUrl ?? '').trim()
    if (!isHttpUrl(url)) return { ok: false, error: 'http(s) ile başlayan geçerli bir bağlantı yapıştır.' }

    const result = await huntMedia(url)
    await audit(actor, 'kaynak taradı', new URL(url).hostname).catch(() => {})
    if (!result.ok) return result
    return { ...result, candidates: result.candidates.map((c) => ({ ...c, preview: signedMediaPath(c.url, c.referer, c.kind) })) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function saveVaultAction(input: { label: string; pageUrl: string; url: string; referer: string; kind: MediaKind; quality: string | null }) {
  try {
    const actor = await requireAdmin()
    if (!isHttpUrl(input.url) || !isHttpUrl(input.referer) || !isHttpUrl(input.pageUrl)) return { ok: false as const, error: 'Bağlantılar geçersiz.' }
    if (input.kind !== 'hls' && input.kind !== 'mp4') return { ok: false as const, error: 'Bilinmeyen kaynak türü.' }
    const item = await saveVaultItem({
      label: String(input.label ?? '').trim().slice(0, 160) || new URL(input.pageUrl).hostname,
      pageUrl: input.pageUrl,
      url: input.url,
      referer: input.referer,
      kind: input.kind,
      quality: typeof input.quality === 'string' ? input.quality.slice(0, 12) : null,
      by: actor,
    })
    await audit(actor, 'kaynak kaydetti', item.label).catch(() => {})
    revalidatePath('/sy-core')
    return { ok: true as const, id: item.id }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function deleteVaultAction(id: string) {
  try {
    const actor = await requireAdmin()
    const item = await getVaultItem(String(id))
    await deleteVaultItem(String(id))
    if (item) await audit(actor, 'kaynak sildi', item.label).catch(() => {})
    revalidatePath('/sy-core')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function attachVaultAction(input: { id: string; animeId: number; animeTitle: string; animeCover: string | null; number: number; title: string }) {
  try {
    const actor = await requireAdmin()
    const item = await getVaultItem(String(input.id))
    if (!item) return { ok: false as const, error: 'Kaynak bulunamadı.' }
    if (!Number.isInteger(input.animeId) || input.animeId <= 0) return { ok: false as const, error: 'Anime seçmelisin.' }
    if (!Number.isInteger(input.number) || input.number <= 0 || input.number > 5000) return { ok: false as const, error: 'Geçerli bir bölüm numarası gir.' }

    await addEpisode({
      animeId: input.animeId,
      animeTitle: String(input.animeTitle).slice(0, 200),
      animeCover: isHttpUrl(input.animeCover) ? input.animeCover : null,
      number: input.number,
      title: String(input.title ?? '').slice(0, 200),
      videoUrl: signedMediaPath(item.url, item.referer, item.kind),
      magnetUrl: null,
      subtitleUrl: null,
      subtitleText: null,
      subtitleLang: 'tr',
      thumbnail: null,
    })
    await audit(actor, 'bölüme bağladı', `${input.animeTitle} #${input.number}`).catch(() => {})
    revalidatePath(`/anime/${input.animeId}`)
    revalidatePath('/sy-core')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}
