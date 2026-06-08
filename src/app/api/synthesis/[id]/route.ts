import { loadSynthesis } from "@/lib/ticket/synthesis-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const rec = loadSynthesis(id);
  if (!rec) return Response.json({ error: "kayıt yok" }, { status: 404 });
  return Response.json(rec);
}
