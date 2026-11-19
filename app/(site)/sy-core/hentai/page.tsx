import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/session'
import { searchHanime, getVideo } from '@/lib/hanime/catalog'
import { listSources } from '@/lib/hanime/sources-store'
import { addSourceAction, deleteSourceAction } from '@/app/actions/hentai'

export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | undefined>>

export default async function HentaiAdminPage({ searchParams }: { searchParams: SP }) {
  if (!(await isAdmin())) redirect('/')

  const sp = await searchParams
  const q = sp.q?.trim() || ''
  const slug = sp.slug || ''

  const results = q ? (await searchHanime({ q })).items.slice(0, 12) : []
  const selected = slug ? await getVideo(slug) : null
  const sources = slug ? await listSources(slug) : []

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hentai kaynaklari</h1>
        <Link href="/sy-core" className="text-sm text-muted-foreground underline">panele don</Link>
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Baslik ara" className="h-10 flex-1 rounded-lg border border-border px-3 text-sm" />
        <button className="h-10 rounded-lg border border-border px-4 text-sm">Ara</button>
      </form>

      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((v) => (
            <li key={v.slug}>
              <Link href={'/sy-core/hentai?q=' + encodeURIComponent(q) + '&slug=' + v.slug} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted">
                {v.poster && <img src={v.poster} alt="" className="h-10 w-16 rounded object-cover" />}
                <span className="truncate">{v.name}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{v.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
          <p className="text-sm">
            Secili: <strong>{selected.name}</strong> <span className="text-muted-foreground">({selected.slug})</span>
          </p>

          <form action={addSourceAction} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <input type="hidden" name="slug" value={selected.slug} />
            <input name="url" required placeholder="https://.../master.m3u8 veya .mp4" className="h-10 rounded-lg border border-border px-3 text-sm" />
            <input name="label" placeholder="etiket (ops.)" className="h-10 rounded-lg border border-border px-3 text-sm" />
            <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">Ekle</button>
          </form>

          <ul className="flex flex-col gap-1">
            {sources.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                <span className="font-mono">{s.kind}</span>
                <span className="truncate">{s.label}</span>
                <span className="truncate text-muted-foreground">{s.url}</span>
                <form action={deleteSourceAction} className="ml-auto">
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="slug" value={s.slug} />
                  <button className="text-destructive">sil</button>
                </form>
              </li>
            ))}
            {sources.length === 0 && <li className="text-xs text-muted-foreground">Kaynak yok.</li>}
          </ul>

          <Link href={'/hentai/' + selected.slug} className="text-sm underline">Sayfayi ac</Link>
        </div>
      )}
    </div>
  )
}