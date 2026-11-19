'use server'

import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/session'
import { addSource, deleteSource } from '@/lib/hanime/sources-store'

async function guard() {
  if (!(await isAdmin())) throw new Error('Yetkisiz islem')
}

export async function addSourceAction(formData: FormData) {
  await guard()
  const slug = String(formData.get('slug') || '').trim()
  const url = String(formData.get('url') || '').trim()
  const label = String(formData.get('label') || '').trim()
  if (!slug || !/^https:\/\//.test(url)) return
  await addSource({ slug, url, label })
  revalidatePath('/sy-core/hentai')
  revalidatePath('/hentai/' + slug)
}

export async function deleteSourceAction(formData: FormData) {
  await guard()
  const id = String(formData.get('id') || '')
  const slug = String(formData.get('slug') || '')
  await deleteSource(id)
  revalidatePath('/sy-core/hentai')
  if (slug) revalidatePath('/hentai/' + slug)
}