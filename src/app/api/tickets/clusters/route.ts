import { z } from "zod";
import { listClusters, type GroupBy } from "@/lib/ticket/clusters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  groupBy: z.enum(["kok_neden", "kategori_uzun", "bug_group", "bildirim_tipi"]).default("kok_neden"),
  lookbackDays: z.coerce.number().int().min(1).max(730).default(180),
  top: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    groupBy: url.searchParams.get("groupBy") ?? undefined,
    lookbackDays: url.searchParams.get("lookbackDays") ?? undefined,
    top: url.searchParams.get("top") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz parametre", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const clusters = listClusters({
      groupBy: parsed.data.groupBy as GroupBy,
      lookbackDays: parsed.data.lookbackDays,
      top: parsed.data.top,
    });
    return Response.json({ clusters });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
