/*
 * POST /api/cc-tickets/suggest-open
 * Body: { description, project?, customer_name? }
 *
 * Açıklama metnini enroute-rag mikroservisine gönderir → RAG semantik
 * benzer ticket'lardan öğrenilmiş kategorileri döner → v3 → v2 mapping
 * ile root vocab'a çevrilir → form pre-fill için kullanılır.
 *
 * Eski Anthropic-bazlı categorizeV2 kaldırıldı. Avantaj:
 *   - Sistem 271 manuel etiketlenmiş geçmiş örnekten öğrenmiş
 *   - Operatör düzeltirse bir dahaki sefere doğru cevap verir (self-improving)
 *   - Hard-coded hint kurallarına bağlı değil
 *
 * Konfig: RAG_URL env değişkeni (default http://localhost:4000)
 */
import { z } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/cc/auth";
import { callRag, mapV3ToV2 } from "@/lib/cc/rag-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  description: z.string().min(5).max(4000),
  project: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: err.message }, { status: 401 });
    throw err;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // Sorgu metnini hazırla — açıklama önce, opsiyonel müşteri/proje sonra
    const textParts: string[] = [parsed.data.description];
    if (parsed.data.customer_name) textParts.push(`Müşteri: ${parsed.data.customer_name}`);
    if (parsed.data.project) textParts.push(`Proje: ${parsed.data.project}`);
    const queryText = textParts.join("\n");

    // RAG çağır
    const rag = await callRag(queryText);

    // v3 → v2 mapping (frontend v2 dropdown'larını dolduracak)
    const result = mapV3ToV2(rag, queryText);

    return Response.json(result);
  } catch (err) {
    const msg = (err as Error).message;
    return Response.json(
      {
        error: `Öneri başarısız: ${msg}`,
        hint: msg.includes("ECONNREFUSED") || msg.includes("fetch failed")
          ? "enroute-rag mikroservisi çalışmıyor (port 4000). RAG_URL env değişkeni doğru mu?"
          : undefined,
      },
      { status: 500 },
    );
  }
}
