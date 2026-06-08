/**
 * TBL_N4B_COZUM_ACIKLAMALAR snapshot.
 *
 * Operatörlerin yazdığı detaylı çözüm açıklamaları — 66 satır (Mayıs 2026
 * itibarıyla), her satır ZENGİN içerik. BILDIRIMNO ile mevcut ticket'a
 * bağlı; KB'ye `operator_resolution` source type'ı olarak ingest edilecek.
 *
 * Snapshot adımı: MSSQL → anonymize → data/embeddings.sqlite > cozum_notlari
 *
 * Kullanım: node scripts/sync-n4b-cozumler.mjs
 */
import "dotenv/config";
import sql from "mssql";
import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import path from "node:path";
import { mkdirSync, existsSync, readFileSync } from "node:fs";

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
  pool: { max: 1 },
  connectionTimeout: 30_000,
  requestTimeout: 60_000,
}).connect();

// Blocklist + anonymizer kopyası — script standalone; TS modülünü require
// edemediğimiz için normalize + replace lojiğini buraya çoğaltıyoruz.
// (Test edilmiş davranış src/lib/ticket/anonymizer.ts ile birebir aynı.)
function normalizeForMatch(s) {
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
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const blocklistPath = path.resolve(process.cwd(), "data/customer-blocklist.json");
if (!existsSync(blocklistPath)) {
  console.error("Blocklist yok. Önce çalıştır: node scripts/build-customer-blocklist.mjs");
  process.exit(1);
}
const blocklist = JSON.parse(readFileSync(blocklistPath, "utf8"));
const needles = blocklist.customers
  .filter((c) => c.normalized.length >= 3)
  .map((c) => ({
    canonical: c.canonical,
    pattern: new RegExp(
      `\\b${c.normalized.split(" ").map(escapeRegex).join("\\s+")}\\b`,
      "gi",
    ),
  }));

function anonymize(input) {
  if (!input) return input;
  let text = normalizeForMatch(input);
  for (const n of needles) text = text.replace(n.pattern, "<MUSTERI>");
  return text;
}

// Lokal sqlite — mevcut embeddings.sqlite'a yeni tablo ekliyoruz.
const dbPath = path.resolve(process.cwd(), "data/embeddings.sqlite");
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS cozum_notlari (
    lng_kod         INTEGER PRIMARY KEY,
    bildirim_no     INTEGER,
    kullanici       TEXT,
    gdt             TEXT,
    lng_kok_neden   INTEGER,
    cozum_text      TEXT NOT NULL,
    musteri_sorunu  TEXT,
    tespit_sorun    TEXT,
    txt_kok_neden   TEXT,
    text_hash       TEXT NOT NULL,
    synced_at       TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_cozum_bildirim ON cozum_notlari(bildirim_no);
  CREATE INDEX IF NOT EXISTS idx_cozum_gdt ON cozum_notlari(gdt);
`);

const r = await pool.request().query(`
  SELECT LNGKOD, BILDIRIMNO, TXTCOZUMACIKLAMA, GDT, LNGKULLANICIKOD, LNGKOKNEDEN,
         TXTMUSTERISORUNU, TXTTESPITEDILENSORUN, TXTKOKNEDEN, TXTKULLANICI
  FROM TBL_N4B_COZUM_ACIKLAMALAR
  ORDER BY GDT DESC
`);
console.log(`MSSQL'den ${r.recordset.length} satır geldi.`);

const upsert = db.prepare(`
  INSERT INTO cozum_notlari (
    lng_kod, bildirim_no, kullanici, gdt, lng_kok_neden,
    cozum_text, musteri_sorunu, tespit_sorun, txt_kok_neden,
    text_hash, synced_at
  ) VALUES (
    @lng_kod, @bildirim_no, @kullanici, @gdt, @lng_kok_neden,
    @cozum_text, @musteri_sorunu, @tespit_sorun, @txt_kok_neden,
    @text_hash, @synced_at
  )
  ON CONFLICT(lng_kod) DO UPDATE SET
    bildirim_no = excluded.bildirim_no,
    kullanici = excluded.kullanici,
    gdt = excluded.gdt,
    lng_kok_neden = excluded.lng_kok_neden,
    cozum_text = excluded.cozum_text,
    musteri_sorunu = excluded.musteri_sorunu,
    tespit_sorun = excluded.tespit_sorun,
    txt_kok_neden = excluded.txt_kok_neden,
    text_hash = excluded.text_hash,
    synced_at = excluded.synced_at
`);

const now = new Date().toISOString();
const writeAll = db.transaction((rows) => {
  for (const x of rows) {
    // Anonymize çözüm metni ve diğer free-text alanları
    const cozumAnon = anonymize(x.TXTCOZUMACIKLAMA) ?? "";
    const sorunAnon = anonymize(x.TXTMUSTERISORUNU);
    const tespitAnon = anonymize(x.TXTTESPITEDILENSORUN);
    const kokNedenAnon = anonymize(x.TXTKOKNEDEN);
    const hash = createHash("sha256").update(cozumAnon).digest("hex");
    upsert.run({
      lng_kod: x.LNGKOD,
      bildirim_no: x.BILDIRIMNO ?? null,
      kullanici: x.TXTKULLANICI ?? null,
      gdt: x.GDT ? x.GDT.toISOString() : null,
      lng_kok_neden: x.LNGKOKNEDEN ?? null,
      cozum_text: cozumAnon,
      musteri_sorunu: sorunAnon,
      tespit_sorun: tespitAnon,
      txt_kok_neden: kokNedenAnon,
      text_hash: hash,
      synced_at: now,
    });
  }
});
writeAll(r.recordset);

const count = db.prepare("SELECT COUNT(*) AS c FROM cozum_notlari").get().c;
console.log(`✓ Lokal tabloda toplam ${count} çözüm notu`);
await pool.close();
db.close();
