/**
 * /api/v1/* — Varuna KB entegrasyonu için endpoint'ler.
 *
 * Varuna'nın çağırdığı path'leri Varuna config'ini değiştirmeden karşıla:
 *   GET  /api/v1/health     → health + embeddings durumu
 *   GET  /api/v1/stats      → dashboard agregat verileri
 *   POST /api/v1/categorize → RAG tahmini (9 alan + confidence + similar)
 *   POST /api/v1/kb/ask     → soru-cevap (doküman bekleniyor)
 *   POST /api/v1/kb/search  → semantic search (AI yok, hızlı)
 *   POST /api/v1/analyze    → analiz (doküman bekleniyor)
 *
 * Auth: Bearer token (EXTERNAL_KB_API_KEY) ŞU AN DEVRE DIŞI — her isteği
 *       kabul ediyoruz. İleride güvenlik için açılabilir.
 */
import type { FastifyInstance } from "fastify";
import { ping as mssqlPing } from "../db/mssql.js";
import { countTickets } from "../db/cache.js";
import { indexStats, searchSimilar } from "../lib/vector-store.js";
import { getStatsResponse } from "./stats.js";
import { runCategorize } from "./categorize.js";

export async function registerV1Routes(app: FastifyInstance): Promise<void> {
  // ─── GET /api/v1/stats ──────────────────────────────────────
  app.get("/stats", async () => getStatsResponse());

  // ─── POST /api/v1/categorize ────────────────────────────────
  app.post<{ Body: { text: string; k?: number } }>("/categorize", async (req, reply) => {
    try {
      const r = await runCategorize(req.body?.text ?? "", req.body?.k);
      if ("error" in r) {
        reply.code(r.status);
        return r;
      }
      return r;
    } catch (e) {
      reply.code(500);
      return { error: (e as Error).message };
    }
  });

  // ─── GET /api/v1/health ─────────────────────────────────────
  app.get("/health", async () => {
    const m = await mssqlPing();
    const emb = indexStats();
    return {
      ok: m.ok,
      version: "v1",
      mssql: m,
      cache: { count: countTickets() },
      embeddings: emb,
      uptime: process.uptime(),
    };
  });

  // ─── POST /api/v1/kb/search ─────────────────────────────────
  // Embedding similarity → top-K ticket. AI yok, hızlı + ucuz.
  type SearchBody = {
    query?: string;
    text?: string;
    topK?: number;
    rerank?: boolean;
    strictness?: "lenient" | "strict";
  };
  app.post<{ Body: SearchBody }>("/kb/search", async (req, reply) => {
    const text = (req.body?.query ?? req.body?.text ?? "").trim();
    if (text.length < 5) {
      reply.code(400);
      return { error: "query/text en az 5 karakter olmalı" };
    }
    const topK = Math.min(20, Math.max(1, req.body?.topK ?? 8));
    const strictness = req.body?.strictness ?? "lenient";
    const minScore = strictness === "strict" ? 0.7 : 0.5;

    try {
      const t0 = Date.now();
      const similar = await searchSimilar(text, topK);
      const results = similar
        .filter((s) => s.similarity >= minScore)
        .map((s) => ({
          ticket_id: s.bildirimNo,
          score: Number(s.similarity.toFixed(4)),
          content: s.musteriSorunu || s.cozumText.slice(0, 300),
          metadata: {
            kategori: s.kategori,
            etkilenen_nesne: s.etkilenenNesne,
            platform: s.platform,
            islem_tipi: s.islemTipi,
            etki: s.etki,
            kok_neden_grup: s.kokNedenGrup,
            kok_neden_detay: s.kokNedenDetay,
            cozum_tipi: s.cozumTipi,
            self_servis: s.selfServis,
          },
          ticket_text: {
            musteri_sorunu: s.musteriSorunu,
            tespit: s.tespitSorun,
            cozum: s.cozumText,
          },
        }));
      return {
        ok: true,
        query: text,
        topK,
        strictness,
        results,
        meta: { ms: Date.now() - t0, total_indexed: indexStats().total },
      };
    } catch (e) {
      reply.code(500);
      return { error: (e as Error).message };
    }
  });

  // ─── POST /api/v1/kb/ask ────────────────────────────────────
  // Stub — doküman gelince doldurulacak (Gemini ile soru-cevap + sources).
  app.post("/kb/ask", async (_req, reply) => {
    reply.code(501);
    return {
      error: "Not implemented yet",
      hint: "API doküman bekleniyor — request/response schema netleşince eklenecek",
    };
  });

  // ─── POST /api/v1/analyze ───────────────────────────────────
  // Stub — doküman gelince doldurulacak.
  app.post("/analyze", async (_req, reply) => {
    reply.code(501);
    return {
      error: "Not implemented yet",
      hint: "API doküman bekleniyor — request/response schema netleşince eklenecek",
    };
  });
}
