/**
 * Vector store — ticket embedding'leri için SQLite-bazlı RAG.
 *
 * 267 ticket için tam scan (cosine) yeterli (~3-5ms).
 * 10K+ olunca sqlite-vss veya HNSW eklenir.
 */
import { getDb } from "../db/cache.js";
import { cosineSim, vecToBlob, blobToVec, embed } from "./embedding.js";

const MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

export type SimilarTicket = {
  bildirimNo: number;
  similarity: number;
  musteriSorunu: string;
  tespitSorun: string;
  cozumText: string;
  kategori: string | null;
  etkilenenNesne: string | null;
  platform: string | null;
  islemTipi: string | null;
  etki: string | null;
  kokNedenGrup: string | null;
  kokNedenDetay: string | null;
  cozumTipi: string | null;
  selfServis: string | null;
};

/** Bir ticket için embedding hesapla ve sakla. */
export async function indexTicket(bildirimNo: number, text: string): Promise<void> {
  const vec = await embed(text);
  const db = getDb();
  db.prepare(`
    INSERT INTO ticket_embeddings (bildirim_no, embedding, model, source_text, embedded_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(bildirim_no) DO UPDATE SET
      embedding = excluded.embedding,
      model = excluded.model,
      source_text = excluded.source_text,
      embedded_at = excluded.embedded_at
  `).run(bildirimNo, vecToBlob(vec), MODEL, text.slice(0, 500), new Date().toISOString());
}

/** Sorgu metni için en benzer K ticket'ı bul. */
export async function searchSimilar(queryText: string, k = 10): Promise<SimilarTicket[]> {
  const queryVec = await embed(queryText);
  const db = getDb();

  // Tüm embeddings + ticket metadata
  const rows = db.prepare(`
    SELECT
      t.bildirim_no AS bildirimNo,
      t.musteri_sorunu AS musteriSorunu,
      t.tespit_sorun AS tespitSorun,
      t.cozum_text AS cozumText,
      t.is_sureci AS kategori,
      t.etkilenen_nesne AS etkilenenNesne,
      t.platform,
      t.islem_tipi AS islemTipi,
      t.etki,
      t.kok_neden_grup AS kokNedenGrup,
      t.kok_neden_detay AS kokNedenDetay,
      t.cozum_tipi AS cozumTipi,
      t.self_servis AS selfServis,
      e.embedding
    FROM tickets t
    JOIN ticket_embeddings e ON e.bildirim_no = t.bildirim_no
  `).all() as Array<SimilarTicket & { embedding: Buffer }>;

  // Cosine sim hesapla, sırala, top-K döndür
  const scored = rows.map((r) => {
    const vec = blobToVec(r.embedding);
    const sim = cosineSim(queryVec, vec);
    const { embedding: _, ...rest } = r;
    return { ...rest, similarity: sim };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, k);
}

/** Bir ticket için embedding indexlendi mi? */
export function isIndexed(bildirimNo: number): boolean {
  const r = getDb().prepare("SELECT 1 FROM ticket_embeddings WHERE bildirim_no = ?").get(bildirimNo);
  return r !== undefined;
}

/** İstatistik */
export function indexStats(): { total: number; model: string } {
  const r = getDb().prepare("SELECT COUNT(*) AS n, MAX(model) AS model FROM ticket_embeddings").get() as
    | { n: number; model: string | null }
    | undefined;
  return { total: r?.n ?? 0, model: r?.model ?? MODEL };
}
