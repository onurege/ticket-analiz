import { getTicket } from "@/lib/ticket/local-store";
import { getById } from "@/lib/ticket/resolver";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ bildirimNo: string }> },
): Promise<Response> {
  const { bildirimNo: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "bildirimNo pozitif tam sayı olmalı" }, { status: 400 });
  }
  const local = getTicket(id);
  if (local) return Response.json({ source: "local", row: local });
  try {
    const row = await getById(id);
    if (!row) return Response.json({ error: "kayıt bulunamadı" }, { status: 404 });
    return Response.json({ source: "view", row });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
