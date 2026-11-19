'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { CUSTOM_THEME_LIMIT, HEX_RE, sanitizeThemeName, type CustomTheme } from '@/lib/custom-theme'
import { hasTier } from '@/lib/membership'
import { getCurrentUser, saveUser } from '@/lib/users'

type Result = { ok: true; themes: CustomTheme[]; theme?: CustomTheme } | { ok: false; error: string }

export async function saveCustomTheme(input: { id?: string; name: string; hex: string }): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Özel tema kaydetmek için giriş yapmalısın.' }
  if (!hasTier(user.premium, 'plus')) return { ok: false, error: 'Özel temalar Sytheris+ ve Ultra üyelerine özel.' }
  const name = sanitizeThemeName(String(input.name ?? ''))
  const hex = String(input.hex ?? '').toLowerCase()
  if (name.length < 2) return { ok: false, error: 'Temana en az 2 karakterlik bir isim ver.' }
  if (!HEX_RE.test(hex)) return { ok: false, error: 'Geçersiz renk.' }
  const list = [...(user.customThemes ?? [])]
  const existing = input.id ? list.findIndex((t) => t.id === input.id) : -1
  let theme: CustomTheme
  if (existing >= 0) {
    theme = { ...list[existing], name, hex }
    list[existing] = theme
  } else {
    if (list.length >= CUSTOM_THEME_LIMIT) return { ok: false, error: `En fazla ${CUSTOM_THEME_LIMIT} özel tema kaydedebilirsin. Birini silip tekrar dene.` }
    theme = { id: randomBytes(5).toString('hex'), name, hex }
    list.unshift(theme)
  }
  user.customThemes = list
  await saveUser(user)
  revalidatePath('/ayarlar')
  return { ok: true, themes: list, theme }
}

export async function deleteCustomTheme(id: string): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }
  user.customThemes = (user.customThemes ?? []).filter((t) => t.id !== id)
  await saveUser(user)
  revalidatePath('/ayarlar')
  return { ok: true, themes: user.customThemes }
}
