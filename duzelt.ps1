$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Patch([string]$rel, [string]$find, [string]$repl, [string]$label) {
  $p = Join-Path $root $rel
  if (-not (Test-Path $p)) { Write-Host ("YOK   " + $rel) -ForegroundColor Red; return }
  $c = [IO.File]::ReadAllText($p)
  if (-not $c.Contains($find)) { Write-Host ("ATLA  " + $label) -ForegroundColor Yellow; return }
  Copy-Item $p ($p + "." + $stamp + ".bak") -Force
  $enc = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($p, $c.Replace($find, $repl), $enc)
  Write-Host ("OK    " + $label) -ForegroundColor Green
}

# --- 1. gate: /api yolunu ac ---
$gate = Join-Path $root 'lib/gate.ts'
if (Test-Path $gate) {
  $g = [IO.File]::ReadAllText($gate)
  $enc = New-Object System.Text.UTF8Encoding($false)
  if ($g.Contains("'/giris'") -and -not $g.Contains("'/api'")) {
    Copy-Item $gate ($gate + "." + $stamp + ".bak") -Force
    [IO.File]::WriteAllText($gate, $g.Replace("'/giris'", "'/api', '/giris'"), $enc)
    Write-Host 'OK    gate: /api acildi' -ForegroundColor Green
  } elseif ($g.Contains('"/giris"') -and -not $g.Contains('"/api"')) {
    Copy-Item $gate ($gate + "." + $stamp + ".bak") -Force
    [IO.File]::WriteAllText($gate, $g.Replace('"/giris"', '"/api", "/giris"'), $enc)
    Write-Host 'OK    gate: /api acildi' -ForegroundColor Green
  } else {
    Write-Host 'ELLE  gate.ts icindeki acik yol listesine /api ekle' -ForegroundColor Yellow
  }
} else { Write-Host 'YOK   lib/gate.ts' -ForegroundColor Red }

# --- 2. oynatici: HTML gelirse anlasilir hata ---
Patch 'components/hentai/hanime-player.tsx' `
'        const json = (await r.json()) as { sources?: Source[]; error?: string }' `
"        if (!(r.headers.get(''content-type'') ?? '''').includes(''json'')) throw new Error(''Servis JSON yerine HTML dondurdu - /api yolu gate tarafindan kapatilmis olabilir.'')
        const json = (await r.json()) as { sources?: Source[]; error?: string }" `
'oynatici: icerik tipi kontrolu'

# --- 3. oynatici: tekrar dene dugmesi ---
Patch 'components/hentai/hanime-player.tsx' `
'            <Link href={external} target="_blank" rel="noopener noreferrer"' `
'            <button type="button" onClick={() => location.reload()} className="mt-1 rounded-full border border-foreground/25 px-4 py-1.5 text-xs">Tekrar dene</button>
            <Link href={external} target="_blank" rel="noopener noreferrer"' `
'oynatici: tekrar dene'

# --- 4. katalog: searchTitles alani ---
Patch 'lib/hanime/catalog.ts' `
'  titles: string[]' `
'  titles: string[]
  searchTitles: string' `
'katalog: searchTitles tipi'

Patch 'lib/hanime/catalog.ts' `
'    tags: toTags(raw.tags),' `
'    searchTitles: str(raw.search_titles),
    tags: toTags(raw.tags),' `
'katalog: searchTitles doldurma'

# --- 5. katalog: fold + haystack ---
Patch 'lib/hanime/catalog.ts' `
'function normalize(raw: Raw): HanimeVideo | null {' `
"const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(.)\1+/g, '''$1''')
    .trim()

const haystack = (v: HanimeVideo) =>
  fold([v.name, v.searchTitles, v.slug, v.brand ?? '', v.tags.map((t) => t.text).join(' ')].join(' '))

function normalize(raw: Raw): HanimeVideo | null {" `
'katalog: fold + haystack'

# --- 6. katalog: esnek arama ---
Patch 'lib/hanime/catalog.ts' `
'  const q = input.q?.trim().toLowerCase()' `
'  const q = input.q?.trim()' `
'katalog: q normalize kaldir'

Patch 'lib/hanime/catalog.ts' `
'  if (q) items = items.filter((v) => v.name.toLowerCase().includes(q) || v.titles.some((t) => t.toLowerCase().includes(q)) || v.slug.includes(q))' `
"  if (q) {
    const tokens = fold(q).split(' ').filter(Boolean)
    if (tokens.length) {
      const scored = items.map((v) => ({ v, hay: haystack(v) }))
      const strict = scored.filter((s) => tokens.every((t) => s.hay.includes(t)))
      const pool = strict.length ? strict : scored.filter((s) => tokens.some((t) => s.hay.includes(t)))
      const folded = fold(q)
      const score = (v: HanimeVideo) => {
        const name = fold(v.name)
        if (name === folded) return 1000
        if (name.startsWith(folded)) return 500
        return tokens.filter((t) => haystack(v).includes(t)).length * 50
      }
      items = pool.map((s) => s.v).sort((a, b) => score(b) - score(a))
    }
  }" `
'katalog: esnek arama'

# --- 7. katalog: aramada siralama ezilmesin ---
Patch 'lib/hanime/catalog.ts' `
"  const sort = input.sort && input.sort in SORTERS ? input.sort : 'trending'
  items = [...items].sort(SORTERS[sort])" `
"  if (!q) {
    const sort = input.sort && input.sort in SORTERS ? input.sort : 'trending'
    items = [...items].sort(SORTERS[sort])
  }" `
'katalog: siralama korumasi'

Write-Host ''
Write-Host 'Bitti. Yedekler: *.bak' -ForegroundColor Cyan
