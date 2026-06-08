/**
 * Müşteri adı blocklist'i kur.
 *
 * Lokal embeddings.sqlite içindeki distinct PROJE değerlerinden + statik
 * eklemelerden türetilir. Anonymizer bu listeyi okur ve sorguda/çıktıda
 * müşteri-bazlı arama girişimlerini reddeder.
 *
 * Kullanım: node scripts/build-customer-blocklist.mjs
 */
import Database from "better-sqlite3";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const TICKETS_DB = path.resolve(process.cwd(), "data/embeddings.sqlite");
if (!existsSync(TICKETS_DB)) {
  console.error("Lokal ticket snapshot yok:", TICKETS_DB);
  process.exit(1);
}

// Statik ekleme — embeddings'de henüz olmayan ama bloklanması istenen markalar.
// PROJE'den gelen liste zaten geniş; bunu sadece elle takviye için kullan.
const STATIC_EXTRA = [
  // Örnek: "Coca Cola", "Pepsi"
];

const db = new Database(TICKETS_DB, { readonly: true });
const projes = db.prepare(`
  SELECT DISTINCT proje FROM tickets
  WHERE proje IS NOT NULL AND TRIM(proje) <> ''
`).all().map((x) => x.proje);
db.close();

// Normalize ederken hem ham hem normalize halini saklıyoruz.
// Türkçe karakterleri ASCII'ye indirip, sonra lowercase + sembol stripping.
// toLowerCase'i diakritik replacementten sonra yapmak şart; aksi halde
// "İ" → combining-dot'lu "i̇" oluşur ve "İLAÇ" → "i lac" gibi bozulur.
function normalize(s) {
  return s
    .replaceAll("İ", "I").replaceAll("ı", "i")
    .replaceAll("Ğ", "G").replaceAll("ğ", "g")
    .replaceAll("Ü", "U").replaceAll("ü", "u")
    .replaceAll("Ş", "S").replaceAll("ş", "s")
    .replaceAll("Ö", "O").replaceAll("ö", "o")
    .replaceAll("Ç", "C").replaceAll("ç", "c")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const seen = new Set();
const entries = [];
for (const raw of [...projes, ...STATIC_EXTRA]) {
  const norm = normalize(raw);
  if (norm.length < 3) continue; // Çok kısa → false positive riski
  if (seen.has(norm)) continue;
  seen.add(norm);
  entries.push({
    canonical: raw.trim(),
    normalized: norm,
    tokens: norm.split(" ").filter((t) => t.length >= 3),
  });
}

// Türetilmiş suffix patternleri — output maskelemede ek koruma için.
// Bu patternlere uyan "yeni" şirket isimleri PROJE'de yoksa bile yakalanır.
const COMPANY_SUFFIXES = [
  "A.Ş.", "A.S.", "AS",
  "Ltd. Şti.", "Ltd. Sti.", "LTD ŞTI", "Ltd Şti",
  "San. Tic.", "San Tic", "SAN TIC", "Sanayi",
  "Tic. Ltd.", "Tic Ltd",
  "Holding", "Group", "Grup",
  "Gıda", "Otomotiv", "Tekstil", "İnşaat", "Petrol", "Kimya",
  "Lojistik", "Pazarlama", "Üretim",
];

const out = {
  generatedAt: new Date().toISOString(),
  source: "data/embeddings.sqlite > tickets.proje (distinct)",
  totalCustomers: entries.length,
  customers: entries,
  companySuffixes: COMPANY_SUFFIXES,
};

const outPath = path.resolve(process.cwd(), "data/customer-blocklist.json");
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log(`✓ ${entries.length} müşteri yazıldı → ${outPath}`);
console.log(`  +${COMPANY_SUFFIXES.length} şirket sonek pattern`);
console.log("\nÖrnek girdiler:");
for (const e of entries.slice(0, 5)) {
  console.log(`  ${e.canonical.padEnd(30)} → norm: "${e.normalized}", tokens: [${e.tokens.join(", ")}]`);
}
