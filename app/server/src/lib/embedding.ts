/**
 * Gemini embedding servisi.
 *
 * `gemini-embedding-001` modeli — Türkçe için iyi, 1536 boyut, ucuz.
 * Rate limit'e karşı basit retry + delay.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const API_KEY = process.env.GEMINI_API_KEY;

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!API_KEY) throw new Error("GEMINI_API_KEY tanımlı değil");
  if (!client) client = new GoogleGenerativeAI(API_KEY);
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Tek bir metin için embedding.
 * Otomatik retry (3x, exponential backoff).
 */
export async function embed(text: string, retries = 3): Promise<Float32Array> {
  const cleaned = (text ?? "").trim().slice(0, 8000);
  if (cleaned.length < 5) throw new Error("Metin çok kısa (<5 char)");

  const model = getClient().getGenerativeModel({ model: MODEL });

  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await model.embedContent(cleaned);
      const vec = r.embedding.values;
      return new Float32Array(vec);
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) {
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }
  throw new Error(`Embedding başarısız: ${(lastErr as Error).message}`);
}

/** Cosine similarity */
export function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Float32Array → SQLite BLOB için Buffer */
export function vecToBlob(v: Float32Array): Buffer {
  return Buffer.from(v.buffer);
}

export function blobToVec(buf: Buffer): Float32Array {
  // BLOB buffer'ı doğru hizalanmış mı kontrol et
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
