import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = 'proje-baska-ai-icin.txt';

// Atlanacak klasörler
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 
  '.turbo', '.cache', 'coverage', '.vercel', '.idea', '.vscode', '.fix-backup'
]);

// Atlanacak dosyalar
const IGNORE_FILES = new Set([
  'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 
  'proje-baska-ai-icin.txt', 'dump-for-ai.mjs', '.DS_Store'
]);

// Atlanacak uzantılar (resim, video vb.)
const IGNORE_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', 
  '.pdf', '.zip', '.mp4', '.mp3', '.woff', '.woff2', '.ttf'
]);

const chunks = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);

    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      walk(full);
    } else {
      // GÜVENLİK: .env ve .env.local gibi gizli dosyaları atla
      if (e.name.startsWith('.env')) continue;
      
      if (IGNORE_FILES.has(e.name)) continue;
      
      const ext = path.extname(e.name).toLowerCase();
      if (IGNORE_EXT.has(ext)) continue;

      try {
        const content = fs.readFileSync(full, 'utf8');
        chunks.push(`\n\n// ==========================================\n// DOSYA: ${rel}\n// ==========================================\n${content}`);
      } catch (err) {
        // Binary dosyaları atla
      }
    }
  }
}

console.log("🚀 Proje taranıyor (Gizli dosyalar ve .env hariç)...");
walk(ROOT);

const header = `Sana bir Next.js projesinin kodlarını veriyorum. Lütfen tüm bu kodları incele ve bana yardımcı ol.\n\n`;

fs.writeFileSync(OUT, header + chunks.join(''), 'utf8');
console.log(`✅ Başarılı! ${chunks.length} dosya döküldü.`);
console.log(`📁 Dosya konumu: ${OUT}`);