import { z } from "zod";
import { ask } from "@/lib/kb/ask";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// RAG: retrieval (embed) + generation + verifier (Gemini), 30-60s aralığında
// olabilir; Next default 10s yetmez.
export const maxDuration = 120;

const SourceType = z.enum(["pdf", "panorama_screen", "ticket_resolution"]);

const Body = z.object({
  query: z.string().min(3),
  topK: z.number().int().min(1).max(20).optional(),
  sourceTypes: z.array(SourceType).optional(),
  rerank: z.boolean().optional(),
  verify: z.boolean().optional(),
  strictness: z.enum(["lenient", "normal", "strict"]).optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON gövde." }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const result = await ask(parsed.data.query, {
      topK: parsed.data.topK,
      sourceTypes: parsed.data.sourceTypes,
      rerank: parsed.data.rerank,
      verify: parsed.data.verify,
      strictness: parsed.data.strictness,
    });
    return Response.json(result);
  } catch (err) {
    console.error("kb/ask error:", err);
    return Response.json(
      { error: (err as Error)?.message ?? "bilinmeyen hata" },
      { status: 500 },
    );
  }
}
