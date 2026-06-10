/**
 * POST /api/feedback
 *
 * Operatör AI önerisini onaylar veya düzeltir.
 * Bu vakayı bilgi tabanına ekler → sonraki tahminler bu örneği kullanır.
 *
 * Body: {
 *   sourceText: string,         // Müşterinin yazdığı (orijinal)
 *   aiSuggestion: object,       // AI'ın önerisi (loglama için)
 *   finalLabels: object,        // Operatörün onayladığı/düzelttiği 9 alan
 *   bildirimNo?: number,        // Mevcut ticket düzeltmesi mi (opsiyonel)
 *   wasCorrected: boolean       // AI doğru muydu yoksa düzeltildi mi
 * }
 *
 * Yaptıkları:
 *   1. feedback_log'a kaydet
 *   2. Eğer bildirim_no varsa → mevcut ticket'ı UPDATE (manuel-feedback)
 *      Yoksa → yeni "öğretmen" satırı ekle (negative bildirim_no, kb_*)
 *   3. Embedding hesapla ve vector store'a ekle
 *
 * Sonuç: bir sonraki /api/categorize bu örneği similarity search'te bulur.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/cache.js";
import { embed, vecToBlob } from "../lib/embedding.js";

const MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

type FeedbackBody = {
  sourceText: string;
  aiSuggestion?: Record<string, unknown>;
  finalLabels: {
    kategori: string;
    etkilenen_nesne: string;
    platform: string;
    islem_tipi: string;
    etki: string;
    kok_neden_grup: string;
    kok_neden_detay: string;
    cozum_tipi: string;
    self_servis: string;
  };
  bildirimNo?: number;
  wasCorrected: boolean;
};

export function registerFeedbackRoutes(app: FastifyInstance): void {
  app.post<{ Body: FeedbackBody }>("/api/feedback", async (req, reply) => {
    const b = req.body;
    if (!b?.sourceText || !b?.finalLabels) {
      reply.code(400);
      return { error: "sourceText ve finalLabels zorunlu" };
    }

    const db = getDb();
    const now = new Date().toISOString();

    // 1. Feedback log
    db.prepare(`
      INSERT INTO feedback_log (
        bildirim_no, source_text, ai_suggestion, final_labels, was_corrected, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      b.bildirimNo ?? null,
      b.sourceText.slice(0, 2000),
      JSON.stringify(b.aiSuggestion ?? null),
      JSON.stringify(b.finalLabels),
      b.wasCorrected ? 1 : 0,
      now,
    );

    let bildirimNoForVector: number;

    if (b.bildirimNo) {
      // 2a. Mevcut ticket'ın etiketlerini güncelle (manuel-feedback)
      db.prepare(`
        UPDATE tickets SET
          is_sureci = @kategori,
          etkilenen_nesne = @etkilenen_nesne,
          platform = @platform,
          islem_tipi = @islem_tipi,
          etki = @etki,
          kok_neden_grup = @kok_neden_grup,
          kok_neden_detay = @kok_neden_detay,
          cozum_tipi = @cozum_tipi,
          self_servis = @self_servis,
          confidence = 1.0,
          reason = 'feedback-corrected',
          categorized_at = @ts
        WHERE bildirim_no = @bildirimNo
      `).run({ ...b.finalLabels, bildirimNo: b.bildirimNo, ts: now });
      bildirimNoForVector = b.bildirimNo;
    } else {
      // 2b. Yeni "öğretmen" kaydı oluştur — negatif bildirim_no kullan (gerçek N4B çakışmasın)
      const minBid = (db.prepare("SELECT MIN(bildirim_no) AS m FROM tickets").get() as { m: number }).m;
      const kbBid = Math.min(-1, (minBid ?? 0) - 1);

      db.prepare(`
        INSERT INTO tickets (
          bildirim_no, kullanici, gdt, musteri_sorunu, tespit_sorun, cozum_text, cozum_len,
          is_sureci, etkilenen_nesne, platform, islem_tipi, etki,
          kok_neden_grup, kok_neden_detay, cozum_tipi, self_servis,
          confidence, reason, categorized_at
        ) VALUES (
          @bildirimNo, 'feedback', @ts, @sourceText, '', @sourceText, @len,
          @kategori, @etkilenen_nesne, @platform, @islem_tipi, @etki,
          @kok_neden_grup, @kok_neden_detay, @cozum_tipi, @self_servis,
          1.0, 'feedback-kb', @ts
        )
      `).run({
        bildirimNo: kbBid,
        ts: now,
        sourceText: b.sourceText.slice(0, 4000),
        len: b.sourceText.length,
        ...b.finalLabels,
      });
      bildirimNoForVector = kbBid;
    }

    // 3. Embedding ekle (vector store)
    try {
      const vec = await embed(b.sourceText);
      db.prepare(`
        INSERT INTO ticket_embeddings (bildirim_no, embedding, model, source_text, embedded_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(bildirim_no) DO UPDATE SET
          embedding = excluded.embedding,
          source_text = excluded.source_text,
          embedded_at = excluded.embedded_at
      `).run(bildirimNoForVector, vecToBlob(vec), MODEL, b.sourceText.slice(0, 500), now);
    } catch (e) {
      app.log.warn({ err: (e as Error).message }, "Feedback embedding eklenemedi");
    }

    const total = (db.prepare("SELECT COUNT(*) AS n FROM ticket_embeddings").get() as { n: number }).n;

    return {
      ok: true,
      bildirimNo: bildirimNoForVector,
      vectorStoreSize: total,
      wasCorrected: b.wasCorrected,
    };
  });
}
