/**
 * Local SQLite cache — kategorize edilmiş ticket'ları tutar.
 *
 * Şema tek tablo (tickets) + meta (watermark için).
 * Idempotent: aynı bildirimNo ile INSERT OR REPLACE.
 */
import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { config } from "../config.js";

export type TicketRow = {
  bildirimNo: number;
  kullanici: string | null;
  gdt: string; // ISO
  musteriSorunu: string; // müşterinin orijinal sorusu (TXTMUSTERISORUNU)
  tespitSorun: string; // operatörün tespiti (TXTTESPITEDILENSORUN)
  cozumText: string;
  cozumLen: number;
  // Etiketler
  isSureci: string | null;
  islemTipi: string | null;
  etkilenenNesne: string | null;
  etki: string | null;
  kokNedenGrup: string | null;
  kokNedenDetay: string | null;
  cozumTipi: string | null;
  // v3 yeni alanlar
  platform: string | null;
  selfServis: string | null;
  // Meta
  confidence: number;
  reason: string;
  categorizedAt: string;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const path = config.cache.path;
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  initSchema(db);
  return db;
}

function initSchema(d: Database.Database): void {
  d.exec(`
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

  // Migration: mevcut tablolara yeni kolonlar (idempotent)
  const cols = d.prepare("PRAGMA table_info(tickets)").all() as { name: string }[];
  const has = (c: string) => cols.some((x) => x.name === c);
  if (!has("musteri_sorunu")) d.exec("ALTER TABLE tickets ADD COLUMN musteri_sorunu TEXT NOT NULL DEFAULT ''");
  if (!has("tespit_sorun")) d.exec("ALTER TABLE tickets ADD COLUMN tespit_sorun TEXT NOT NULL DEFAULT ''");
  if (!has("platform")) d.exec("ALTER TABLE tickets ADD COLUMN platform TEXT");
  if (!has("self_servis")) d.exec("ALTER TABLE tickets ADD COLUMN self_servis TEXT");

  // Vector store — ticket'ların embedding'leri (RAG için)
  d.exec(`
    CREATE TABLE IF NOT EXISTS ticket_embeddings (
      bildirim_no   INTEGER PRIMARY KEY,
      embedding     BLOB NOT NULL,
      model         TEXT NOT NULL,
      source_text   TEXT NOT NULL,
      embedded_at   TEXT NOT NULL
    );
  `);

  // Feedback log — operatör onay/düzeltmeleri (öğrenme verisi)
  d.exec(`
    CREATE TABLE IF NOT EXISTS feedback_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      bildirim_no     INTEGER,
      source_text     TEXT NOT NULL,
      ai_suggestion   TEXT NOT NULL,
      final_labels    TEXT NOT NULL,
      was_corrected   INTEGER NOT NULL,
      created_at      TEXT NOT NULL
    );
  `);
}

// ─── Meta (watermark) ─────────────────────────────────────────
export function getMeta(key: string): string | null {
  const row = getDb().prepare<[string]>("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  getDb()
    .prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

// ─── Tickets ─────────────────────────────────────────────────
const upsertStmt = (): Database.Statement =>
  getDb().prepare(`
    INSERT INTO tickets (
      bildirim_no, kullanici, gdt, musteri_sorunu, tespit_sorun, cozum_text, cozum_len,
      is_sureci, islem_tipi, etkilenen_nesne, etki,
      kok_neden_grup, kok_neden_detay, cozum_tipi,
      confidence, reason, categorized_at
    ) VALUES (
      @bildirimNo, @kullanici, @gdt, @musteriSorunu, @tespitSorun, @cozumText, @cozumLen,
      @isSureci, @islemTipi, @etkilenenNesne, @etki,
      @kokNedenGrup, @kokNedenDetay, @cozumTipi,
      @confidence, @reason, @categorizedAt
    )
    ON CONFLICT(bildirim_no) DO UPDATE SET
      kullanici=excluded.kullanici,
      gdt=excluded.gdt,
      musteri_sorunu=excluded.musteri_sorunu,
      tespit_sorun=excluded.tespit_sorun,
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
    WHERE tickets.reason != 'manual-v1'
  `);

/**
 * Manuel kategorize edilen ticket'larda metin alanlarını (müşteri sorusu, tespit, çözüm)
 * günceller. Etiketleri DOKUNMAZ — manuel etiketler korunur.
 */
export function upsertTextOnly(rows: N4BTextRow[]): number {
  if (rows.length === 0) return 0;
  const stmt = getDb().prepare(`
    UPDATE tickets SET
      kullanici=@kullanici,
      gdt=@gdt,
      musteri_sorunu=@musteriSorunu,
      tespit_sorun=@tespitSorun,
      cozum_text=@cozumText,
      cozum_len=@cozumLen
    WHERE bildirim_no=@bildirimNo
  `);
  let n = 0;
  const tx = getDb().transaction((items: N4BTextRow[]) => {
    for (const r of items) {
      const res = stmt.run(r);
      if (res.changes > 0) n++;
    }
  });
  tx(rows);
  return n;
}

export type N4BTextRow = {
  bildirimNo: number;
  kullanici: string | null;
  gdt: string;
  musteriSorunu: string;
  tespitSorun: string;
  cozumText: string;
  cozumLen: number;
};

export function upsertTickets(rows: TicketRow[]): number {
  if (rows.length === 0) return 0;
  const stmt = upsertStmt();
  const tx = getDb().transaction((items: TicketRow[]) => {
    for (const r of items) stmt.run(r);
  });
  tx(rows);
  return rows.length;
}

export function countTickets(): number {
  const r = getDb().prepare("SELECT COUNT(*) AS n FROM tickets").get() as { n: number };
  return r.n;
}

export function getLatestGdt(): string | null {
  const r = getDb()
    .prepare("SELECT MAX(gdt) AS gdt FROM tickets")
    .get() as { gdt: string | null };
  return r.gdt;
}
