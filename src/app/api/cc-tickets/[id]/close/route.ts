import { z } from "zod";
import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { closeTicket, getTicketById } from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";
import {
  isValidKokNeden,
  isValidCozumTipi,
  isValidKaliciOnlem,
} from "@/lib/cc/taxonomy-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  resolution: z.string().min(5).max(20000),
  // v2 kapanış alanları — kok_neden_grubu ve cozum_tipi ZORUNLU,
  // kok_neden_detayi ZORUNLU (grup verildiyse), kalici_onlem opsiyonel.
  close_kok_neden_grubu: z.string().min(1),
  close_kok_neden_detayi: z.string().min(1),
  close_cozum_tipi: z.string().min(1),
  close_kalici_onlem: z.string().nullable().optional(),
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
  if (ticket.status === "closed") {
    return Response.json(
      { error: "Bu ticket zaten kapalı." },
      { status: 400 },
    );
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
      {
        error:
          "Eksik veya geçersiz alanlar — kapatma için: çözüm metni, kök neden grubu+detayı, çözüm tipi gereklidir.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  // Taksonomi doğrulaması — strict, listelerdeki değerlerden olmalı.
  if (!isValidKokNeden(data.close_kok_neden_grubu, data.close_kok_neden_detayi)) {
    return Response.json(
      {
        error: `Geçersiz kök neden: "${data.close_kok_neden_grubu} › ${data.close_kok_neden_detayi}" taksonomide yok.`,
      },
      { status: 400 },
    );
  }
  if (!isValidCozumTipi(data.close_cozum_tipi)) {
    return Response.json(
      { error: `Geçersiz çözüm tipi: "${data.close_cozum_tipi}".` },
      { status: 400 },
    );
  }
  if (data.close_kalici_onlem && !isValidKaliciOnlem(data.close_kalici_onlem)) {
    return Response.json(
      { error: `Geçersiz kalıcı önlem: "${data.close_kalici_onlem}".` },
      { status: 400 },
    );
  }

  const updated = closeTicket(id, actor.id, {
    resolution: data.resolution,
    close_kok_neden_grubu: data.close_kok_neden_grubu,
    close_kok_neden_detayi: data.close_kok_neden_detayi,
    close_cozum_tipi: data.close_cozum_tipi,
    close_kalici_onlem: data.close_kalici_onlem ?? null,
  });
  return Response.json({ ticket: updated });
}
