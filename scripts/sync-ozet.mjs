/**
 * Ticket_Kayıtları_Ozet tablosunu yerel SQLite'a indir.
 *
 * Bu tablo VIEW'in aksine sağlam JSON içermiyor, agregasyon için ideal.
 * Tek seferde tüm satırları (~117k) batch'li çekip
 * data/ozet.sqlite içine yazıyoruz.
 *
 * Kullanım: node scripts/sync-ozet.mjs
 */
import "dotenv/config";
import sql from "mssql";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const e = process.env;
const pool = await new sql.ConnectionPool({
  server: e.TICKET_MSSQL_SERVER,
  port: Number(e.TICKET_MSSQL_PORT ?? 1433),
  database: e.TICKET_MSSQL_DATABASE,
  user: e.TICKET_MSSQL_USER,
  password: e.TICKET_MSSQL_PASSWORD,
  options: {
    instanceName: e.TICKET_MSSQL_INSTANCE,
    encrypt: e.TICKET_MSSQL_ENCRYPT === "true",
    trustServerCertificate: e.TICKET_MSSQL_TRUST_SERVER_CERT !== "false",
    enableArithAbort: true,
  },
  pool: { max: 1, min: 0, idleTimeoutMillis: 5000 },
  connectionTimeout: 30_000,
  requestTimeout: 180_000,
}).connect();

const dbPath = path.resolve(process.cwd(), "data/ozet.sqlite");
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS ozet (
    bildirim_no INTEGER PRIMARY KEY,
    yil INTEGER,
    ay INTEGER,
    tarih TEXT,
    kategori TEXT,
    oncelik TEXT,
    tfs_no INTEGER,
    tfs_durum TEXT,
    tfs_tip TEXT,
    support TEXT,
    kok_neden TEXT,
    acil TEXT,
    aciklama TEXT,
    cozum TEXT,
    sure REAL,
    ai_kategori TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_ozet_kok ON ozet(kok_neden);
  CREATE INDEX IF NOT EXISTS idx_ozet_kategori ON ozet(kategori);
  CREATE INDEX IF NOT EXISTS idx_ozet_tarih ON ozet(tarih);
  CREATE INDEX IF NOT EXISTS idx_ozet_yilay ON ozet(yil, ay);
`);

// Toplam sayı
const cnt = await pool.request().query(`SELECT COUNT(*) AS n FROM Ticket_Kayıtları_Ozet`);
const total = cnt.recordset[0].n;
console.log(`Toplam: ${total} satır`);

// Mevcut snapshot'ı temizle (full refresh)
db.exec("DELETE FROM ozet");

const insert = db.prepare(`
  INSERT OR REPLACE INTO ozet (
    bildirim_no, yil, ay, tarih, kategori, oncelik, tfs_no, tfs_durum, tfs_tip,
    support, kok_neden, acil, aciklama, cozum, sure, ai_kategori
  ) VALUES (
    @bildirim_no, @yil, @ay, @tarih, @kategori, @oncelik, @tfs_no, @tfs_durum, @tfs_tip,
    @support, @kok_neden, @acil, @aciklama, @cozum, @sure, @ai_kategori
  )
`);

const insertBatch = db.transaction((rows) => {
  for (const r of rows) insert.run(r);
});

const PAGE = 10_000;
let offset = 0;
let imported = 0;
while (offset < total) {
  const r = await pool.request().query(`
    SELECT
      Bildirim_No, yil, AyINT, Bildirim_Tarihi_, Kategori_Adi, Oncelik,
      TfsNo, TfsDurum, TfsTip, Support_L1_L2, Konunun_Kok_Nedeni,
      Acil_Ticket, Bildirim_Aciklamasi, Cozum_Aciklamasi, Sure, AI_Kategori
    FROM Ticket_Kayıtları_Ozet
    ORDER BY Bildirim_No
    OFFSET ${offset} ROWS FETCH NEXT ${PAGE} ROWS ONLY
  `);
  const rows = r.recordset.map((x) => ({
    bildirim_no: x.Bildirim_No,
    yil: x.yil ?? null,
    ay: x.AyINT ?? null,
    tarih: x.Bildirim_Tarihi_ ? x.Bildirim_Tarihi_.toISOString().slice(0, 10) : null,
    kategori: x.Kategori_Adi ?? null,
    oncelik: x.Oncelik ?? null,
    tfs_no: x.TfsNo ? Number(x.TfsNo) : null,
    tfs_durum: x.TfsDurum ?? null,
    tfs_tip: x.TfsTip ?? null,
    support: x.Support_L1_L2 ?? null,
    kok_neden: x.Konunun_Kok_Nedeni ?? null,
    acil: x.Acil_Ticket ?? null,
    aciklama: x.Bildirim_Aciklamasi ?? null,
    cozum: x.Cozum_Aciklamasi ?? null,
    sure: x.Sure != null ? Number(x.Sure) : null,
    ai_kategori: x.AI_Kategori ?? null,
  }));
  insertBatch(rows);
  imported += rows.length;
  offset += PAGE;
  process.stdout.write(`\r  ${imported}/${total}`);
}
console.log();

// Meta
db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);
db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('synced_at', ?)`)
  .run(new Date().toISOString());
db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('row_count', ?)`)
  .run(String(imported));

// Kaynakta aynı Bildirim_No için identical satırlar tekrar ediyor (denormalize).
// INSERT OR REPLACE ile distinct ticket sayısı kalır.
const distinctCount = db.prepare("SELECT COUNT(*) AS c FROM ozet").get().c;
db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES ('row_count', ?)`)
  .run(String(distinctCount));
console.log(`✓ Snapshot tamamlandı → ${dbPath}`);
console.log(`  ${imported} kaynak satır → ${distinctCount} distinct ticket`);
await pool.close();
db.close();
