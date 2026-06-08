import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getTicketById, updateTicket, logEvent } from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";
// v1 categorize artık deprecated.
import { categorizeV2 } from "@/lib/cc/categorizer-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

/**
 * Bir ticket için kategorizasyonu yeniden çalıştır.
 * - Yeni ticket oluştururken otomatik categorize başarısızsa kullanılır
 * - Veya admin manuel re-categorize istiyorsa
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireUser();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0)
    return Response.json({ error: "Geçersiz id" }, { status: 400 });

  const ticket = getTicketById(id);
  if (!ticket) return Response.json({ error: "Ticket yok" }, { status: 404 });
  if (!canAccessTicket(actor, ticket)) {
    return Response.json({ error: "Erişim yok" }, { status: 403 });
  }
  if (ticket.status === "closed") {
    return Response.json(
      { error: "Kapatılmış ticket kategorize edilemez." },
      { status: 400 },
    );
  }

  try {
    // Sadece v2 — 5 açılış alanı
    const v2 = await categorizeV2({
      description: ticket.description,
      project: ticket.project,
      customerName: ticket.customer_name,
    });
    const updated = updateTicket(id, {
      open_urun: v2.urun,
      open_platform: v2.platform,
      open_is_sureci: v2.is_sureci,
      open_islem_tipi: v2.islem_tipi,
      open_etkilenen_nesne: v2.etkilenen_nesne,
      open_etki: v2.etki,
    });
    logEvent({
      ticket_id: id,
      actor_id: actor.id,
      event_type: "categorized",
      payload: {
        v2_urun: v2.urun,
        v2_is_sureci: v2.is_sureci,
        v2_confidence: v2.confidence,
      },
    });
    return Response.json({ ticket: updated, categorization: v2 });
  } catch (err) {
    return Response.json(
      { error: `Kategorizasyon başarısız: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
