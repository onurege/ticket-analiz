/**
 * Tüm 267 manuel-v3 ticket'ı Gemini ile embed et ve vector store'a kaydet.
 *
 * Kullanım:  node scripts/bootstrap-embeddings.mjs
 *
 * Idempotent: zaten embed edilmişleri atlar.
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("GEMINI_API_KEY yok"); process.exit(1); }

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

const db = new Database("./data/cache.sqlite");
db.pragma("journal_mode = WAL");

// Schema yoksa oluştur (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS ticket_embeddings (
    bildirim_no   INTEGER PRIMARY KEY,
    embedding     BLOB NOT NULL,
    model         TEXT NOT NULL,
    source_text   TEXT NOT NULL,
    embedded_at   TEXT NOT NULL
  );
`);

// Henüz embed edilmemiş ticket'lar
const rows = db.prepare(`
  SELECT t.bildirim_no, t.musteri_sorunu, t.tespit_sorun, t.cozum_text
  FROM tickets t
  LEFT JOIN ticket_embeddings e ON e.bildirim_no = t.bildirim_no
  WHERE e.bildirim_no IS NULL
    AND length(t.cozum_text) > 30
`).all();

console.log(`[bootstrap] ${rows.length} ticket embed edilecek (zaten yapılmamış)`);
if (rows.length === 0) {
  const total = db.prepare("SELECT COUNT(*) AS n FROM ticket_embeddings").get();
  console.log(`[bootstrap] ✓ Vector store hazır: ${total.n} ticket indexed`);
  process.exit(0);
}

const stmt = db.prepare(`
  INSERT INTO ticket_embeddings (bildirim_no, embedding, model, source_text, embedded_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(bildirim_no) DO UPDATE SET
    embedding = excluded.embedding,
    model = excluded.model,
    source_text = excluded.source_text,
    embedded_at = excluded.embedded_at
`);

let done = 0, fail = 0;
const t0 = Date.now();

for (const r of rows) {
  // Embed için: müşteri sorusu öncelikli, yoksa tespit, yoksa çözüm
  // Bu sayede yeni ticket geldiğinde (sadece müşteri sorusu olur) benzer eski ticket'lar bulunur.
  let text = (r.musteri_sorunu ?? "").trim();
  if (text.length < 20) text = (r.tespit_sorun ?? "").trim();
  if (text.length < 20) text = r.cozum_text.slice(0, 500);

  try {
    const result = await model.embedContent(text.slice(0, 8000));
    const vec = new Float32Array(result.embedding.values);
    const buf = Buffer.from(vec.buffer);
    stmt.run(r.bildirim_no, buf, MODEL, text.slice(0, 500), new Date().toISOString());
    done++;
    if (done % 25 === 0) {
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[bootstrap] ${done}/${rows.length} (${dt}s)`);
    }
  } catch (e) {
    fail++;
    console.warn(`[bootstrap] ✗ #${r.bildirim_no}: ${e.message}`);
  }

  // Gemini rate limit: 1500 req/min — 40ms gap yeterli
  await new Promise((r) => setTimeout(r, 50));
}

const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n[bootstrap] ✓ ${done} embed (${dt}s), ${fail} fail`);

const total = db.prepare("SELECT COUNT(*) AS n FROM ticket_embeddings").get();
console.log(`[bootstrap] Toplam indexed: ${total.n}`);
db.close();
