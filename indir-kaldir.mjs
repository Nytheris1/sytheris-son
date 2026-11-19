// SYTHERIS · /indir sayfasını tamamen kaldırır.
// Çalıştır: node indir-kaldir.mjs
// Sitenin geri kalanı bu dosyalara bağlı değildir; kaldırdıktan sonra proje sorunsuz derlenir.
import { promises as fs } from 'fs'
import path from 'path'

const ROOT = process.cwd()
const PATHS = ['app/indir', 'app/api/indir', 'components/download', 'lib/project-archive.ts', 'public/sytheris-proje.zip']

for (const rel of PATHS) {
  try {
    await fs.rm(path.join(ROOT, rel), { recursive: true, force: true })
    console.log(`- ${rel}`)
  } catch (e) {
    console.log(`! ${rel}: ${e.message}`)
  }
}

const cfgPath = path.join(ROOT, 'next.config.mjs')
const cfg = await fs.readFile(cfgPath, 'utf8')
const nextCfg = cfg.replace(/\n\s*outputFileTracingIncludes:\s*\{[\s\S]*?\n\s{2}\},/, '').replace(/\nconst ARCHIVE_FILES = \[[\s\S]*?\]\n/, '\n')
if (nextCfg !== cfg) {
  await fs.writeFile(cfgPath, nextCfg)
  console.log('~ next.config.mjs: /indir izleme ayarı kaldırıldı')
}

const gatePath = path.join(ROOT, 'lib', 'gate.ts')
try {
  const gate = await fs.readFile(gatePath, 'utf8')
  const nextGate = gate.replace(", '/indir', '/api/indir'", '')
  if (nextGate !== gate) {
    await fs.writeFile(gatePath, nextGate)
    console.log('~ lib/gate.ts: /indir açık yol listesinden çıkarıldı')
  }
} catch {}

await fs.rm(path.join(ROOT, 'indir-kaldir.mjs'), { force: true })
console.log('\n/indir kaldırıldı. Bu betik de kendini sildi.')
