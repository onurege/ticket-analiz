import { z } from "zod";
import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import {
  getTicketById,
  listTicketEvents,
  updateResolution,
} from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Patch = z.object({
  agent_resolution: z.string().max(20000).optional(),
});

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

function parseId(s: string): number | null {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });

  const ticket = getTicketById(id);
  if (!ticket) return Response.json({ error: "Ticket yok" }, { status: 404 });

  if (!canAccessTicket(user, ticket)) {
    return Response.json(
      { error: "Bu ticket'a erişim yetkiniz yok." },
      { status: 403 },
    );
  }

  const events = listTicketEvents(id);
  return Response.json({ ticket, events });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });

  const ticket = getTicketById(id);
  if (!ticket) return Response.json({ error: "Ticket yok" }, { status: 404 });
  if (!canAccessTicket(user, ticket)) {
    return Response.json(
      { error: "Bu ticket'a erişim yetkiniz yok." },
      { status: 403 },
    );
  }
  if (ticket.status === "closed") {
    return Response.json(
      { error: "Kapatılmış ticket düzenlenemez." },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = Patch.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.agent_resolution !== undefined) {
    const updated = updateResolution(
      id,
      user.id,
      parsed.data.agent_resolution,
    );
    return Response.json({ ticket: updated });
  }

  return Response.json({ ticket });
}
