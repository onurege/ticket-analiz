/**
 * Panorama Kullanım Kılavuzu'ndaki 440 ekranı `data/solutions/` altına
 * "kanonik prosedür" başlığıyla seed olarak ekler.
 *
 * Çıktı: her ekran için bir klasör → meta.json + solution.md
 *   ID format: panorama-<screen_id>
 *
 * Bu seed'i `/support/solutions` sayfası listeler; destek temsilcisi
 * arama yaparak doğru ekran kılavuzunu bulabilir.
 *
 * Çalıştırma: node scripts/seed-solutions-from-panorama.mjs
 */
import fs from "node:fs";
import path from "node:path";

const SCREENS_PATH = "data/panorama-docs/screens.json";
const OUT_ROOT = "data/solutions";

if (!fs.existsSync(SCREENS_PATH)) {
  console.error(`screens.json bulunamadı: ${SCREENS_PATH}`);
  console.error(`Önce: node scripts/parse-panorama-docs.mjs`);
  process.exit(1);
}

const screens = JSON.parse(fs.readFileSync(SCREENS_PATH, "utf8"));
fs.mkdirSync(OUT_ROOT, { recursive: true });

const now = new Date().toISOString();

function tableMd(rows) {
  if (!rows || rows.length === 0) return "_(yok)_";
  const lines = ["| Alan | Açıklama |", "| --- | --- |"];
  for (const r of rows) {
    const name = (r.name ?? "").replace(/\|/g, "\\|");
    const desc = (r.description ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ");
    lines.push(`| ${name} | ${desc} |`);
  }
  return lines.join("\n");
}

let created = 0;
let updated = 0;

for (const s of screens) {
  const solId = `panorama-${s.id.toLowerCase()}`.replace(/[^a-z0-9-]+/g, "-");
  const dir = path.join(OUT_ROOT, solId);
  const isNew = !fs.existsSync(dir);
  fs.mkdirSync(dir, { recursive: true });

  const meta = {
    id: solId,
    title: s.title,
    tags: ["panorama-kilavuz", ...(s.modulePath ?? [])],
    categories: s.modulePath ?? [],
    severity: null,
    createdAt: now,
  };
  // Var olan createdAt'i koru
  const metaPath = path.join(dir, "meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      if (prev.createdAt) meta.createdAt = prev.createdAt;
    } catch {
      // ignore
    }
  }

  const body =
    `# ${s.title}\n\n` +
    `_Kaynak: Panorama Kullanım Kılavuzu_\n\n` +
    (s.menuStep ? `**Menü Adımı:** \`${s.menuStep}\`\n\n` : "") +
    (s.summary ? `## Ekran Tanımı\n\n${s.summary}\n\n` : "") +
    (s.fields && s.fields.length > 0
      ? `## Alan Açıklamaları\n\n${tableMd(s.fields)}\n\n`
      : "") +
    (s.buttons && s.buttons.length > 0
      ? `## Buton Açıklamaları\n\n${tableMd(s.buttons)}\n\n`
      : "") +
    (s.breadcrumb && s.breadcrumb.length > 0
      ? `\n---\n_Yol: ${s.breadcrumb.join(" › ")}_\n`
      : "");

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(dir, "solution.md"), body);

  if (isNew) created++;
  else updated++;
}

console.log(`Panorama → Solutions seed tamamlandı.`);
console.log(`  Yeni  : ${created}`);
console.log(`  Güncellenen : ${updated}`);
console.log(`  Toplam      : ${screens.length}`);
