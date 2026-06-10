/**
 * MSSQL'den tüm 268 ticket'ı yeniden çek; sadece TEXT alanlarını güncelle:
 *   - musteri_sorunu  (TXTMUSTERISORUNU)
 *   - tespit_sorun    (TXTTESPITEDILENSORUN)
 *   - cozum_text      (TXTCOZUMACIKLAMA)
 *
 * Etiketler (is_sureci, kok_neden_grup, vb.) DOKUNULMAZ.
 * Bu sayede manuel kategorize edilenler korunur; sadece eksik olan
 * müşteri sorusu/tespit metinleri eklenir.
 */
import "dotenv/config";
import sql from "mssql";
import Database from "better-sqlite3";
import { resolve } from "node:path";

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

// Anonymize — anonymize.ts'deki ile birebir aynı mantık
const TR = {"İ":"I","ı":"i","Ğ":"G","ğ":"g","Ü":"U","ü":"u","Ş":"S","ş":"s","Ö":"O","ö":"o","Ç":"C","ç":"c"};
function normalize(s) {
  if (!s) return "";
  let r = s;
  for (const [k,v] of Object.entries(TR)) r = r.split(k).join(v);
  return r.toLowerCase().replace(/[^\w\s<>]/g," ").replace(/\s+/g," ").trim();
}
const PHONE_RE = /(?:\+?9?0?[\s.-]?)?\(?(?:5\d{2})\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g;
function anonymize(s) {
  if (!s) return "";
  return normalize(s).replace(PHONE_RE, "<tel>");
}

console.log("[refetch] MSSQL sorgusu...");
const r = await pool.request().query(`
  SELECT
    BILDIRIMNO, TXTKULLANICI, GDT,
    TXTMUSTERISORUNU, TXTTESPITEDILENSORUN, TXTCOZUMACIKLAMA
  FROM TBL_N4B_COZUM_ACIKLAMALAR
  WHERE TXTCOZUMACIKLAMA IS NOT NULL AND LEN(TRIM(TXTCOZUMACIKLAMA)) > 30
  ORDER BY GDT DESC
`);
console.log(`[refetch] ${r.recordset.length} satır geldi`);

await pool.close();

const db = new Database(resolve(process.cwd(), "./data/cache.sqlite"));
db.pragma("journal_mode = WAL");

// Migration — kolon yoksa ekle
const cols = db.prepare("PRAGMA table_info(tickets)").all().map((c) => c.name);
if (!cols.includes("musteri_sorunu")) {
  db.exec("ALTER TABLE tickets ADD COLUMN musteri_sorunu TEXT NOT NULL DEFAULT ''");
  console.log("[refetch] + musteri_sorunu kolonu eklendi");
}
if (!cols.includes("tespit_sorun")) {
  db.exec("ALTER TABLE tickets ADD COLUMN tespit_sorun TEXT NOT NULL DEFAULT ''");
  console.log("[refetch] + tespit_sorun kolonu eklendi");
}

const stmt = db.prepare(`
  UPDATE tickets SET
    musteri_sorunu = @musteriSorunu,
    tespit_sorun   = @tespitSorun,
    cozum_text     = @cozumText,
    cozum_len      = @cozumLen,
    kullanici      = @kullanici
  WHERE bildirim_no = @bildirimNo
`);

let updated = 0, notFound = 0;
let withMusteriSorunu = 0;
const tx = db.transaction((items) => {
  for (const row of items) {
    const musteriSorunu = anonymize(row.TXTMUSTERISORUNU);
    const tespitSorun = anonymize(row.TXTTESPITEDILENSORUN);
    const cozum = anonymize(row.TXTCOZUMACIKLAMA);
    if (musteriSorunu.length > 5) withMusteriSorunu++;
    const res = stmt.run({
      bildirimNo: row.BILDIRIMNO,
      musteriSorunu,
      tespitSorun,
      cozumText: cozum,
      cozumLen: cozum.length,
      kullanici: row.TXTKULLANICI,
    });
    if (res.changes > 0) updated++;
    else notFound++;
  }
});
tx(r.recordset);

console.log(`[refetch] ✓ ${updated} güncellendi, ${notFound} cache'de yok`);
console.log(`[refetch] Müşteri sorusu DOLU olan: ${withMusteriSorunu} / ${r.recordset.length}`);

// Örnek 2 satır göster
const samples = db.prepare(`
  SELECT bildirim_no, SUBSTR(musteri_sorunu, 1, 200) AS soru,
         SUBSTR(tespit_sorun, 1, 100) AS tespit,
         SUBSTR(cozum_text, 1, 100) AS cozum
  FROM tickets WHERE LENGTH(musteri_sorunu) > 30 ORDER BY gdt DESC LIMIT 2
`).all();
console.log("\n=== Örnek 2 ticket (yeni alanlar) ===");
for (const s of samples) {
  console.log(`\n#${s.bildirim_no}`);
  console.log(`  SORU   : ${s.soru}`);
  console.log(`  TESPIT : ${s.tespit}`);
  console.log(`  COZUM  : ${s.cozum}`);
}
db.close();
