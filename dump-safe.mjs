import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = 'guvenli-proje-dokumu.txt';

// Atlanacak klasörler (Gereksiz ve büyük boyutlu olanlar)
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 
  '.turbo', '.cache', 'coverage', '.vercel', '.idea', '.vscode'
]);

// Atlanacak dosyalar (Güvenlik ve boyut için)
const IGNORE_FILES = new Set([
  'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 
  'guvenli-proje-dokumu.txt', '.DS_Store', 'dump.ts', 'dump-safe.mjs'
]);

// Atlanacak uzantılar (Resim, video, font vb.)
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
      // GÜVENLİK: .env ile başlayan tüm dosyaları atla!
      if (e.name.startsWith('.env')) {
        continue; 
      }
      
      if (IGNORE_FILES.has(e.name)) continue;
      
      const ext = path.extname(e.name).toLowerCase();
      if (IGNORE_EXT.has(ext)) continue;

      // Sadece metin tabanlı dosyaları oku (Güvenli yöntem)
      try {
        const content = fs.readFileSync(full, 'utf8');
        chunks.push(`\n\n===== DOSYA: ${rel} =====\n${content}`);
      } catch (err) {
        // Okunamayan (binary olabilecek) dosyaları atla
      }
    }
  }
}

console.log("🚀 Proje taranıyor (Gizli dosyalar ve .env hariç)...");
walk(ROOT);

const header = `PROJE DÖKÜMÜ (GÜVENLİ)\nKök: ${ROOT}\nTarih: ${new Date().toISOString()}\n\n`;

fs.writeFileSync(OUT, header + chunks.join(''), 'utf8');
console.log(`✅ Başarılı! ${chunks.length} dosya döküldü.`);
console.log(`📁 Dosya konumu: ${OUT}`);