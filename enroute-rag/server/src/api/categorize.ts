/**
 * POST /api/categorize
 *
 * RAG + Gemini ile kategorize:
 *   1. Müşteri metni → embedding
 *   2. Vector store'da en benzer K=10 ticket bul
 *   3. Bu 10 örneği Gemini'ye few-shot context olarak ver
 *   4. Gemini 9 alan tahmini + confidence + gerekçe döndürür
 *
 * Body: { text: string, k?: number }
 * Response: { labels, confidence, reasoning, similarExamples[] }
 */
import type { FastifyInstance } from "fastify";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSimilar, type SimilarTicket } from "../lib/vector-store.js";

const GEN_MODEL = process.env.GEMINI_GENERATION_MODEL ?? "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

let taxonomyCache: string | null = null;
function getTaxonomy(): string {
  if (taxonomyCache) return taxonomyCache;
  const path = resolve(process.cwd(), "./data/taxonomy-v3.json");
  taxonomyCache = readFileSync(path, "utf8");
  return taxonomyCache;
}

let genClient: GoogleGenerativeAI | null = null;
function getGenClient(): GoogleGenerativeAI {
  if (!API_KEY) throw new Error("GEMINI_API_KEY tanımlı değil");
  if (!genClient) genClient = new GoogleGenerativeAI(API_KEY);
  return genClient;
}

type CategorizeBody = { text: string; k?: number };

export type CategorizeResult = {
  labels: {
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
  confidence: number;
  reasoning: string;
  similarExamples: Array<{
    bildirimNo: number;
    similarity: number;
    musteriSorunu: string;
    labels: {
      kategori: string | null;
      islem_tipi: string | null;
      kok_neden_grup: string | null;
    };
  }>;
};

function extractJson(s: string): string {
  s = s.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  return a >= 0 && b > a ? s.slice(a, b + 1) : s;
}

function buildPrompt(query: string, similar: SimilarTicket[]): string {
  const taxonomy = getTaxonomy();

  const examples = similar
    .slice(0, 10)
    .map((s, i) => `
ÖRNEK ${i + 1} (benzerlik: ${(s.similarity * 100).toFixed(0)}%)
Müşteri sorusu: ${s.musteriSorunu || "(yok)"}
Operatör tespiti: ${s.tespitSorun || "(yok)"}
Çözüm: ${s.cozumText.slice(0, 200)}
ETIKETLER:
  Kategori: ${s.kategori}
  Etkilenen Nesne: ${s.etkilenenNesne}
  Platform: ${s.platform}
  İşlem Tipi: ${s.islemTipi}
  Etki: ${s.etki}
  Kök Neden Grubu: ${s.kokNedenGrup}
  Kök Neden Detayı: ${s.kokNedenDetay}
  Çözüm Tipi: ${s.cozumTipi}
  Self-Servis: ${s.selfServis}`).join("\n");

  return `Sen EnRoute çağrı merkezi ticket sınıflandırıcısısın. Verilen TAXONOMY içinden 9 alan seç. UYDURMA — sadece taxonomy'deki değerleri kullan.

==== TAXONOMY ====
${taxonomy}

==== GEÇMİŞ BENZER VAKALAR (operatörlerin manuel kategorize ettikleri) ====
${examples}

==== YENİ VAKA ====
Müşteri sorusu / metni:
${query}

==== GÖREV ====
Yukarıdaki 10 örneğin pattern'lerinden yararlanarak bu yeni vakayı kategorize et.

KARAR PRENSİPLERİ:
- Önce benzer örneklere bak — onlar nasıl etiketlenmiş?
- Müşterinin KENDİ ifadelerini önemse:
  - "alıcı etiketi listelenmiyor" → E-Belge müşteri kartı sorunu (Unidox/GİB terminolojisi)
  - "fatura gönderimi" → E-Belge Gönderme (Backoffice'te), "bilgi gönderme" DEĞİL
  - "bilgi gönderme/alma" → Panorama Mobil senkron teknik terimi
  - "bilgilendirme istiyorum" → Bilgilendirme Talebi
  - "müşterilerim", "fatura kestim" → Backoffice perspektifi
- Çelişen sinyaller varsa benzer örneklerin çoğunluğunu seç
- Emin değilsen confidence düşür (0.5 altı)

ÇIKTI SADECE JSON (başka metin ekleme):
{
  "labels": {
    "kategori": "<taxonomy.kategori değerlerinden>",
    "etkilenen_nesne": "<taxonomy.etkilenen_nesne değerlerinden>",
    "platform": "<taxonomy.platform değerlerinden>",
    "islem_tipi": "<taxonomy.islem_tipi değerlerinden>",
    "etki": "<taxonomy.etki değerlerinden>",
    "kok_neden_grup": "<taxonomy.kok_neden_groups[].group değerlerinden>",
    "kok_neden_detay": "<seçtiğin grubun details[] içinden>",
    "cozum_tipi": "<taxonomy.cozum_tipi değerlerinden>",
    "self_servis": "<taxonomy.self_servis_mumkun değerlerinden>"
  },
  "confidence": 0.0..1.0,
  "reasoning": "1-2 cümle Türkçe gerekçe — hangi örneklere benzediği ve neden bu kategoriler"
}`;
}

export function registerCategorizeRoutes(app: FastifyInstance): void {
  app.post<{ Body: CategorizeBody }>("/api/categorize", async (req, reply) => {
    const text = (req.body?.text ?? "").trim();
    if (text.length < 10) {
      reply.code(400);
      return { error: "Metin çok kısa (min 10 char)" };
    }

    const k = Math.min(20, Math.max(3, req.body?.k ?? 10));

    try {
      // 1. Embedding + similarity search
      const t0 = Date.now();
      const similar = await searchSimilar(text, k);
      const tSim = Date.now() - t0;

      if (similar.length === 0) {
        reply.code(404);
        return { error: "Vector store boş, önce bootstrap çalıştır" };
      }

      // 2. Gemini'ye sor
      const tAi0 = Date.now();
      const model = getGenClient().getGenerativeModel({
        model: GEN_MODEL,
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      });
      const prompt = buildPrompt(text, similar);
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const tAi = Date.now() - tAi0;

      // 3. Parse
      let parsed: CategorizeResult;
      try {
        parsed = JSON.parse(extractJson(raw));
      } catch {
        reply.code(500);
        return { error: "AI cevabı parse edilemedi", raw };
      }

      // 4. Similar examples'ı küçült (response için)
      parsed.similarExamples = similar.slice(0, 5).map((s) => ({
        bildirimNo: s.bildirimNo,
        similarity: Number(s.similarity.toFixed(3)),
        musteriSorunu: s.musteriSorunu.slice(0, 150),
        labels: {
          kategori: s.kategori,
          islem_tipi: s.islemTipi,
          kok_neden_grup: s.kokNedenGrup,
        },
      }));

      return {
        ...parsed,
        meta: {
          model: GEN_MODEL,
          similarSearchMs: tSim,
          aiMs: tAi,
          k,
        },
      };
    } catch (e) {
      reply.code(500);
      return { error: (e as Error).message };
    }
  });
}
