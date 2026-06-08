import { z } from "zod";
import { retrieve } from "@/lib/kb/retrieve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const SourceType = z.enum(["pdf", "panorama_screen", "ticket_resolution"]);

const Body = z.object({
  query: z.string().min(2),
  topK: z.number().int().min(1).max(50).optional(),
  sourceTypes: z.array(SourceType).optional(),
  rerank: z.boolean().optional(),
});

/**
 * Raw retrieval — generation YOK. Debug ve UI'da "ne çekiliyor?" görmek için.
 */
export async function POST(req: Request) {
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
    const hits = await retrieve(parsed.data.query, {
      topK: parsed.data.topK ?? 10,
      sourceTypes: parsed.data.sourceTypes,
      rerank: parsed.data.rerank,
    });
    return Response.json({ query: parsed.data.query, hits });
  } catch (err) {
    return Response.json(
      { error: (err as Error)?.message ?? "bilinmeyen hata" },
      { status: 500 },
    );
  }
}
