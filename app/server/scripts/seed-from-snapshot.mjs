/**
 * Mevcut `data/embeddings.sqlite > cozum_notlari` snapshot'ından
 * app cache'ine seed et. Kategorizer üzerinden geçirir.
 *
 * Kullanım:
 *   node scripts/seed-from-snapshot.mjs [snapshot-path]
 *
 * VPN olmadan canlı MSSQL'e ulaşılamadığında app'i çalıştırmak için.
 */
import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// .env yükle (zorunlu değilse de cache path için)
import "dotenv/config";

const SNAPSHOT =
  process.argv[2] ||
  resolve(process.cwd(), "../../data/embeddings.sqlite");
const CACHE = resolve(process.cwd(), process.env.CACHE_DB_PATH ?? "./data/cache.sqlite");

if (!existsSync(SNAPSHOT)) {
  console.error(`✗ Snapshot bulunamadı: ${SNAPSHOT}`);
  process.exit(1);
}

console.log(`[seed] snapshot: ${SNAPSHOT}`);
console.log(`[seed] cache:    ${CACHE}`);

const src = new Database(SNAPSHOT, { readonly: true });
const rows = src
  .prepare(
    `SELECT bildirim_no AS bildirimNo, kullanici, gdt, cozum_text AS cozumText
     FROM cozum_notlari
     WHERE cozum_text IS NOT NULL AND length(trim(cozum_text)) > 30
     ORDER BY gdt ASC`,
  )
  .all();
src.close();
console.log(`[seed] snapshot'tan ${rows.length} kayıt okundu`);

// Cache hazırla
mkdirSync(dirname(CACHE), { recursive: true });
const cache = new Database(CACHE);
cache.pragma("journal_mode = WAL");
cache.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    bildirim_no       INTEGER PRIMARY KEY,
    kullanici         TEXT,
    gdt               TEXT NOT NULL,
    cozum_text        TEXT NOT NULL,
    cozum_len         INTEGER NOT NULL,
    is_sureci         TEXT,
    islem_tipi        TEXT,
    etkilenen_nesne   TEXT,
    etki              TEXT,
    kok_neden_grup    TEXT,
    kok_neden_detay   TEXT,
    cozum_tipi        TEXT,
    confidence        REAL DEFAULT 0,
    reason            TEXT DEFAULT '',
    categorized_at    TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_gdt        ON tickets(gdt DESC);
  CREATE INDEX IF NOT EXISTS idx_tickets_kullanici  ON tickets(kullanici);
  CREATE INDEX IF NOT EXISTS idx_tickets_sureci     ON tickets(is_sureci);
  CREATE INDEX IF NOT EXISTS idx_tickets_kok_grup   ON tickets(kok_neden_grup);
  CREATE INDEX IF NOT EXISTS idx_tickets_cozum_tipi ON tickets(cozum_tipi);
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Categorizer'ı yükle (compiled dist)
const { categorizeN4BRow } = await import("../dist/categorizer/index.js");

const upsert = cache.prepare(`
  INSERT INTO tickets (
    bildirim_no, kullanici, gdt, cozum_text, cozum_len,
    is_sureci, islem_tipi, etkilenen_nesne, etki,
    kok_neden_grup, kok_neden_detay, cozum_tipi,
    confidence, reason, categorized_at
  ) VALUES (
    @bildirimNo, @kullanici, @gdt, @cozumText, @cozumLen,
    @isSureci, @islemTipi, @etkilenenNesne, @etki,
    @kokNedenGrup, @kokNedenDetay, @cozumTipi,
    @confidence, @reason, @categorizedAt
  )
  ON CONFLICT(bildirim_no) DO UPDATE SET
    kullanici=excluded.kullanici,
    gdt=excluded.gdt,
    cozum_text=excluded.cozum_text,
    cozum_len=excluded.cozum_len,
    is_sureci=excluded.is_sureci,
    islem_tipi=excluded.islem_tipi,
    etkilenen_nesne=excluded.etkilenen_nesne,
    etki=excluded.etki,
    kok_neden_grup=excluded.kok_neden_grup,
    kok_neden_detay=excluded.kok_neden_detay,
    cozum_tipi=excluded.cozum_tipi,
    confidence=excluded.confidence,
    reason=excluded.reason,
    categorized_at=excluded.categorized_at
`);

let ok = 0, skip = 0;
const tx = cache.transaction((items) => {
  for (const r of items) {
    const cat = categorizeN4BRow(r);
    if (!cat) { skip++; continue; }
    upsert.run(cat);
    ok++;
  }
});
tx(rows);

cache.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
  .run("last_run", new Date().toISOString());
cache.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
  .run("seed_source", SNAPSHOT);

console.log(`[seed] ✓ ${ok} kategorize, ${skip} atlandı (kısa metin)`);

const counts = {
  total: cache.prepare("SELECT COUNT(*) AS n FROM tickets").get().n,
  sureci: cache.prepare("SELECT is_sureci AS k, COUNT(*) AS n FROM tickets GROUP BY is_sureci ORDER BY n DESC LIMIT 5").all(),
  kok: cache.prepare("SELECT kok_neden_grup AS k, COUNT(*) AS n FROM tickets GROUP BY kok_neden_grup ORDER BY n DESC LIMIT 5").all(),
  ops: cache.prepare("SELECT COUNT(DISTINCT kullanici) AS n FROM tickets").get().n,
};

console.log(`\n=== SEED ÖZETİ ===`);
console.log(`Toplam ticket: ${counts.total}`);
console.log(`Operatör: ${counts.ops}`);
console.log(`\nTop 5 İş Süreci:`);
counts.sureci.forEach(r => console.log(`  ${r.n.toString().padStart(3)}  ${r.k}`));
console.log(`\nTop 5 Kök Neden Grubu:`);
counts.kok.forEach(r => console.log(`  ${r.n.toString().padStart(3)}  ${r.k}`));

cache.close();
