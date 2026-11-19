$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$enc = New-Object System.Text.UTF8Encoding($false)

$files = @('components/hentai/hanime-player.tsx', 'lib/hanime/catalog.ts')

foreach ($rel in $files) {
  $p = Join-Path $root $rel
  if (-not (Test-Path $p)) { Write-Host ("YOK " + $rel) -ForegroundColor Red; continue }
  Copy-Item $p ($p + "." + $stamp + ".bak") -Force

  $c = [IO.File]::ReadAllText($p)
  $before = ([regex]::Matches($c, "''")).Count

  # 1) alt grup referansi olan satir once
  $c = $c.Replace(".replace(/(.)\1+/g, '''''')", ".replace(/(.)\1+/g, '$1')")

  # 2) bos string literalleri: '''' -> ''
  $c = $c.Replace("''''", "''")

  # 3) kalan cift tirnaklar: '' -> '
  $c = $c.Replace("''", "'")

  [IO.File]::WriteAllText($p, $c, $enc)
  Write-Host ("DUZELTILDI " + $rel + "  (once " + $before + " cift tirnak)") -ForegroundColor Green
}

Write-Host ''
Write-Host 'Kalan cift tirnak taramasi:' -ForegroundColor Cyan
foreach ($rel in $files) {
  $p = Join-Path $root $rel
  $hits = Select-String -Path $p -Pattern "''" -SimpleMatch
  if ($hits) { $hits | ForEach-Object { Write-Host ("  " + $rel + ":" + $_.LineNumber + "  " + $_.Line.Trim()) } }
  else { Write-Host ("  temiz: " + $rel) -ForegroundColor Green }
}
