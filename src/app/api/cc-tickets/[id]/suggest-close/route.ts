/*
 * POST /api/cc-tickets/[id]/suggest-close
 * Body: { resolution }
 *
 * Çözüm taslağı + ticket bağlamı (description + açılış sınıflandırması) →
 * AI kapanış önerisi (kok_neden_grubu, kok_neden_detayi, cozum_tipi,
 * kalici_onlem).
 *
 * Form'da "AI ile Önerle" butonu bunu çağırır, dropdown'ları pre-fill eder.
 */
import { z } from "zod";
import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getTicketById } from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";
import { suggestClose } from "@/lib/cc/categorizer-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  resolution: z.string().min(5).max(20000),
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
    return Response.json({ error: "Erişim yok" }, { status: 403 });
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
      { error: "Çözüm taslağı gerekli (en az 5 karakter)" },
      { status: 400 },
    );
  }

  try {
    const result = await suggestClose({
      description: ticket.description,
      resolution: parsed.data.resolution,
      open_urun: ticket.open_urun,
      open_is_sureci: ticket.open_is_sureci,
      open_islem_tipi: ticket.open_islem_tipi,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: `Kapanış önerisi başarısız: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
