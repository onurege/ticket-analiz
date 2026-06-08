import { z } from "zod";
import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import {
  assignTicketTo,
  getTicketById,
  takeTicket,
} from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";
import { getUserById } from "@/lib/cc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  /** null → kendine üstlen; number → o user'a ata. */
  user_id: z.number().int().positive().nullable().optional(),
});

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

export async function POST(
  req: Request,
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
    return Response.json(
      { error: "Bu ticket'a erişim yok." },
      { status: 403 },
    );
  }
  if (ticket.status === "closed") {
    return Response.json(
      { error: "Kapatılmış ticket atanamaz." },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // user_id verilmediyse veya null ise → kendine üstlen
  const targetId = parsed.data.user_id ?? actor.id;
  const targetUser = getUserById(targetId);
  if (!targetUser || targetUser.active !== 1) {
    return Response.json(
      { error: "Hedef kullanıcı bulunamadı veya pasif." },
      { status: 400 },
    );
  }

  const updated =
    targetId === actor.id
      ? takeTicket(id, actor.id)
      : assignTicketTo(id, targetId, actor.id);

  return Response.json({ ticket: updated });
}
