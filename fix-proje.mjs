#!/usr/bin/env node
// fix-proje.mjs — Sytheris güvenli düzeltme scripti
// Kullanım: node fix-proje.mjs

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
const BACKUP = path.join(ROOT, '.fix-backup', STAMP)
const results = []

/* ---------------- helpers ---------------- */

function backup(rel) {
  const src = path.join(ROOT, rel)
  if (!fs.existsSync(src)) return
  const dst = path.join(BACKUP, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(src, dst)
}

function applyFix(rel, fn) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) {
    results.push({ rel, status: 'yok', reason: 'dosya bulunamadı' })
    return
  }
  const original = fs.readFileSync(full, 'utf8')
  const out = fn(original)
  if (!out.changed) {
    results.push({ rel, status: 'atlandı', reason: out.reason ?? 'zaten düzeltilmiş' })
    return
  }
  backup(rel)
  fs.writeFileSync(full, out.content, 'utf8')
  results.push({ rel, status: 'düzeltildi', reason: out.reason })
}

function createFile(rel, content) {
  const full = path.join(ROOT, rel)
  if (fs.existsSync(full)) {
    results.push({ rel, status: 'atlandı', reason: 'zaten var' })
    return
  }
  fs.writeFileSync(full, content, 'utf8')
  results.push({ rel, status: 'oluşturuldu', reason: 'yeni dosya' })
}

/* ---------------- 1) lib/session.ts — cookie fix ---------------- */

applyFix('lib/session.ts', (src) => {
  const old = `export const cookieOptions = (maxAgeSeconds: number) =>
  ({
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  })`

  const neu = `const isProd = process.env.NODE_ENV === 'production'

export const cookieOptions = (maxAgeSeconds: number) =>
  ({
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  })`

  if (src.includes('const isProd = process.env.NODE_ENV')) {
    return { changed: false, reason: 'zaten düzeltilmiş' }
  }
  if (!src.includes(old)) {
    return { changed: false, reason: 'cookieOptions bloğu beklenen formatta değil, elle kontrol et' }
  }
  return {
    changed: true,
    content: src.replace(old, neu),
    reason: 'localhost/cookie + CSRF uyumu (secure: isProd, sameSite: lax)',
  }
})

/* ---------------- 2) tsconfig.json — target ES2022 ---------------- */

applyFix('tsconfig.json', (src) => {
  if (src.includes('"target": "ES2022"')) return { changed: false, reason: 'zaten ES2022' }
  const out = src.replace(/"target":\s*"ES6"/, '"target": "ES2022"')
  if (out === src) return { changed: false, reason: '"target": "ES6" bulunamadı' }
  return { changed: true, content: out, reason: 'target: ES6 → ES2022' }
})

/* ---------------- 3) pnpm-workspace.yaml — typo temizliği ---------------- */

applyFix('pnpm-workspace.yaml', (src) => {
  if (!src.includes('pmOnFail')) return { changed: false, reason: 'pmOnFail satırı yok' }
  const out = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('pmOnFail'))
    .join('\n')
    .replace(/^\s*\n/, '')
  return { changed: true, content: out, reason: 'geçersiz `pmOnFail` satırı kaldırıldı' }
})

/* ---------------- 4) package.json — typecheck script ---------------- */

applyFix('package.json', (src) => {
  let json
  try {
    json = JSON.parse(src)
  } catch {
    return { changed: false, reason: 'geçersiz JSON' }
  }
  const scripts = json.scripts ?? {}
  if (scripts.typecheck && scripts['fix:all']) return { changed: false, reason: 'zaten ekli' }
  json.scripts = {
    ...scripts,
    typecheck: 'tsc --noEmit',
    'fix:all': 'node fix-proje.mjs',
  }
  return { changed: true, content: JSON.stringify(json, null, 2) + '\n', reason: 'typecheck + fix:all scriptleri eklendi' }
})

/* ---------------- 5) .gitignore — dump artıkları ---------------- */

applyFix('.gitignore', (src) => {
  const wanted = ['.fix-backup/', 'proje-dump.txt', 'dump.ts', '*.bak']
  const missing = wanted.filter((w) => !src.includes(w))
  if (missing.length === 0) return { changed: false, reason: 'zaten ekli' }
  const block = `\n# proje temizlik artıkları\n${missing.join('\n')}\n`
  return { changed: true, content: src.trimEnd() + '\n' + block, reason: `eklendi: ${missing.join(', ')}` }
})

/* ---------------- 6) .env.example ---------------- */

createFile('.env.example', `# SYTHERIS — örnek ortam değişkenleri
# Kopyala: cp .env.example .env.local

ADMIN_PASSWORD=buraya-uzun-rastgele-sifre
SESSION_SECRET=openssl-rand-base64-32-ciktisi
DATABASE_URL=postgres://user:pass@host/db

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GEMINI_API_KEY=
OLLAMA_URL=
OLLAMA_MODEL=llama3.2
`)

/* ---------------- .env.local uyarı kontrolü ---------------- */

const warnings = []
const envPath = path.join(ROOT, '.env.local')
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')
  if (/^ADMIN_PASSWORD=nytheria12$/m.test(env)) {
    warnings.push('🚨 .env.local içindeki ADMIN_PASSWORD (`nytheria12`) ifşa oldu — DEĞİŞTİR.')
  }
  if (/^SESSION_SECRET=\s*$/m.test(env)) {
    warnings.push('⚠️  SESSION_SECRET boş — `openssl rand -base64 32` çıktısını ekle.')
  }
  if (/^DATABASE_URL=\s*$/m.test(env)) {
    warnings.push('⚠️  DATABASE_URL boş — Vercel/Neon bağlanmadan veriler kalıcı olmaz.')
  }
}

/* ---------------- rapor ---------------- */

console.log('\n━━━ SYTHERIS DÜZELTME RAPORU ━━━\n')
const icon = { düzeltildi: '✅', atlandı: '⏭️ ', yok: '❌', oluşturuldu: '🆕' }
for (const r of results) {
  console.log(`${icon[r.status] ?? '·'} ${r.rel.padEnd(24)} ${r.status.padEnd(11)} ${r.reason ?? ''}`)
}

if (results.some((r) => r.status === 'düzeltildi' || r.status === 'oluşturuldu')) {
  console.log(`\n📦 Yedekler: ${path.relative(ROOT, BACKUP)}`)
}
if (warnings.length) {
  console.log('\n━━━ UYARILAR ━━━\n')
  for (const w of warnings) console.log(w)
}
console.log('\n✔ Bitti. `git diff` ile değişiklikleri inceleyebilirsin.\n')