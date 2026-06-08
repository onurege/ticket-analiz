import { z } from "zod";
import { runSynthesis } from "@/lib/ticket/synthesizer";
import { listSyntheses, synthesisIdFor, loadSynthesis } from "@/lib/ticket/synthesis-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PostBody = z.object({
  groupBy: z.enum(["kok_neden", "kategori_uzun", "bug_group", "bildirim_tipi"]),
  groupKey: z.string().min(1),
  lookbackDays: z.number().int().min(1).max(730).optional(),
  sampleSize: z.number().int().min(3).max(60).optional(),
  force: z.boolean().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = PostBody.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const rec = await runSynthesis(parsed.data);
    return Response.json(rec);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

const GetQuery = z.object({
  groupBy: z.string().optional(),
  groupKey: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = GetQuery.safeParse({
    groupBy: url.searchParams.get("groupBy") ?? undefined,
    groupKey: url.searchParams.get("groupKey") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz parametre", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  // Belirli grup için tek kayıt
  if (parsed.data.groupBy && parsed.data.groupKey) {
    const id = synthesisIdFor(parsed.data.groupBy, parsed.data.groupKey);
    const rec = loadSynthesis(id);
    if (!rec) return Response.json({ error: "kayıt yok" }, { status: 404 });
    return Response.json(rec);
  }
  // Listele
  return Response.json({ items: listSyntheses(parsed.data.limit) });
}
