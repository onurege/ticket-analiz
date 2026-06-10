/**
 * snapshot-v3.json'dan cache.sqlite oluştur.
 * (Sıfırdan kurulum için — cache.sqlite git'e dahil değil.)
 *
 * Kullanım:  node scripts/restore-from-snapshot.mjs
 *
 * Adım sonrası: node scripts/bootstrap-embeddings.mjs ile embedding'leri al.
 */
import Database from "better-sqlite3";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const SNAP = "./data/snapshot-v3.json";
const CACHE = "./data/cache.sqlite";

if (!existsSync(SNAP)) {
  console.error(`✗ Snapshot yok: ${SNAP}`);
  process.exit(1);
}

const rows = JSON.parse(readFileSync(SNAP, "utf8"));
console.log(`[restore] snapshot: ${rows.length} ticket`);

mkdirSync(dirname(CACHE), { recursive: true });
const db = new Database(CACHE);
db.pragma("journal_mode = WAL");

// Şema (cache.ts ile aynı)
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    bildirim_no       INTEGER PRIMARY KEY,
    kullanici         TEXT,
    gdt               TEXT NOT NULL,
    musteri_sorunu    TEXT NOT NULL DEFAULT '',
    tespit_sorun      TEXT NOT NULL DEFAULT '',
    cozum_text        TEXT NOT NULL,
    cozum_len         INTEGER NOT NULL,
    is_sureci         TEXT,
    islem_tipi        TEXT,
    etkilenen_nesne   TEXT,
    etki              TEXT,
    kok_neden_grup    TEXT,
    kok_neden_detay   TEXT,
    cozum_tipi        TEXT,
    platform          TEXT,
    self_servis       TEXT,
    confidence        REAL DEFAULT 0,
    reason            TEXT DEFAULT '',
    categorized_at    TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS ticket_embeddings (
    bildirim_no   INTEGER PRIMARY KEY,
    embedding     BLOB NOT NULL,
    model         TEXT NOT NULL,
    source_text   TEXT NOT NULL,
    embedded_at   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS feedback_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    bildirim_no     INTEGER,
    source_text     TEXT NOT NULL,
    ai_suggestion   TEXT NOT NULL,
    final_labels    TEXT NOT NULL,
    was_corrected   INTEGER NOT NULL,
    created_at      TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_gdt ON tickets(gdt DESC);
  CREATE INDEX IF NOT EXISTS idx_tickets_kullanici ON tickets(kullanici);
`);

const stmt = db.prepare(`
  INSERT OR REPLACE INTO tickets (
    bildirim_no, kullanici, gdt, musteri_sorunu, tespit_sorun, cozum_text, cozum_len,
    is_sureci, etkilenen_nesne, platform, islem_tipi, etki,
    kok_neden_grup, kok_neden_detay, cozum_tipi, self_servis,
    confidence, reason, categorized_at
  ) VALUES (
    @bildirim_no, @kullanici, @gdt, @musteri_sorunu, @tespit_sorun, @cozum_text, @cozum_len,
    @kategori, @etkilenen_nesne, @platform, @islem_tipi, @etki,
    @kok_neden_grup, @kok_neden_detay, @cozum_tipi, @self_servis,
    @confidence, @reason, @gdt
  )
`);

let n = 0;
const tx = db.transaction((items) => {
  for (const r of items) {
    stmt.run({
      ...r,
      cozum_len: (r.cozum_text || "").length,
      musteri_sorunu: r.musteri_sorunu ?? "",
      tespit_sorun: r.tespit_sorun ?? "",
    });
    n++;
  }
});
tx(rows);

console.log(`[restore] ✓ ${n} ticket restore edildi`);
console.log(`[restore]   Sıradaki: node scripts/bootstrap-embeddings.mjs`);
db.close();
