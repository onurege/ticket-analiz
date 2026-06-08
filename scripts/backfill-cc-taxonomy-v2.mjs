/**
 * CC ticket'larda v3 açılış taksonomisini geri doldur (6 alan).
 *
 * Tarama: open_platform NULL olan tüm ticket'lar (v3'te eklendi, eski
 * etiketlenenler bu kolonda boş). categorizer-v2 çalıştır → DB'ye yaz.
 *
 * Kullanım: npx tsx scripts/backfill-cc-taxonomy-v2.mjs [--limit N] [--dry-run]
 *           [--force]  // open_platform dolu olanlar da yeniden işlensin
 */
import { config as dotenv } from "dotenv";
import Database from "better-sqlite3";
import path from "node:path";

// Açık env dosyası — shell'deki boş ANTHROPIC_API_KEY'i override et
dotenv({ path: path.resolve(process.cwd(), ".env"), override: true });

const args = process.argv.slice(2);
const limit = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) : 1000;
})();
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

// CC ticket'lar shared sqlite içinde — cc_tickets tablosu
const dbPath = path.resolve(process.cwd(), "data/embeddings.sqlite");
const db = new Database(dbPath);

// v3'te open_platform NULL olanlar hedef (yeni kolon, eski etiketlenenler bu
// alanda boş). --force varsa dolu olanlar da yeniden işlenir.
const whereClause = force
  ? "length(trim(description)) > 5"
  : "(open_platform IS NULL OR open_platform = '') AND length(trim(description)) > 5";
const rows = db
  .prepare(
    `SELECT id, ticket_no, description, project, customer_name
     FROM cc_tickets
     WHERE ${whereClause}
     ORDER BY opened_at DESC
     LIMIT ?`,
  )
  .all(limit);

console.log(`Backfill adayı: ${rows.length} ticket (limit=${limit})`);
if (rows.length === 0) {
  console.log("Hiç eksik ticket yok, çıkılıyor.");
  db.close();
  process.exit(0);
}

if (dryRun) {
  console.log("DRY-RUN — DB'ye yazılmayacak. İlk 5 ticket:");
  for (const r of rows.slice(0, 5)) {
    console.log(`  #${r.ticket_no}  ${r.description.slice(0, 80)}…`);
  }
  db.close();
  process.exit(0);
}

// TS modülü dinamik import — ESM tsx ile çalışır
const { categorizeV2 } = await import("../src/lib/cc/categorizer-v2.ts");

const update = db.prepare(`
  UPDATE cc_tickets SET
    open_urun = @open_urun,
    open_platform = @open_platform,
    open_is_sureci = @open_is_sureci,
    open_islem_tipi = @open_islem_tipi,
    open_etkilenen_nesne = @open_etkilenen_nesne,
    open_etki = @open_etki,
    updated_at = datetime('now')
  WHERE id = @id
`);

let ok = 0, fail = 0, partial = 0;
let totalCostUsd = 0;
for (const r of rows) {
  try {
    const res = await categorizeV2({
      description: r.description,
      project: r.project ?? null,
      customerName: r.customer_name ?? null,
    });
    update.run({
      id: r.id,
      open_urun: res.urun,
      open_platform: res.platform,
      open_is_sureci: res.is_sureci,
      open_islem_tipi: res.islem_tipi,
      open_etkilenen_nesne: res.etkilenen_nesne,
      open_etki: res.etki,
    });
    const filled = [res.urun, res.platform, res.is_sureci, res.islem_tipi, res.etkilenen_nesne, res.etki]
      .filter(Boolean).length;
    if (filled === 0) fail++;
    else if (filled < 6) partial++;
    else ok++;
    totalCostUsd += res.costUsd;
    process.stdout.write(filled === 6 ? "." : filled === 0 ? "x" : "-");
  } catch (err) {
    fail++;
    process.stdout.write("!");
    console.error(`\n  #${r.ticket_no} hata: ${(err).message}`);
  }
}
console.log();

console.log(`✓ Tam (6/6): ${ok}, kısmen: ${partial}, sıfır: ${fail}`);
console.log(`Toplam tahmini maliyet: $${totalCostUsd.toFixed(4)}`);
db.close();
