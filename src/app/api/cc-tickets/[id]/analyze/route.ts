import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getTicketById, updateTicket, logEvent } from "@/lib/cc/store";
import { canAccessTicket } from "@/lib/cc/visibility";
import { runAnalysis } from "@/lib/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// AI 15-30s
export const maxDuration = 120;

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

/**
 * Quick mode ile açılmış ticket için sonradan AI analizi tetikle.
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
      { error: "Kapatılmış ticket için analiz çalıştırılamaz." },
      { status: 400 },
    );
  }

  try {
    const result = await runAnalysis({
      freeText: ticket.description,
      project: ticket.project ?? undefined,
    });
    const updated = updateTicket(id, {
      analysis_id: result.analysisId,
      ai_ran: true,
      ai_root_cause: JSON.stringify(result.analysis.rootCauseHypotheses),
      ai_steps: JSON.stringify(result.analysis.suggestedSteps),
      ai_customer_reply: result.analysis.customerReplyDraft,
      ai_handoff: result.analysis.engineeringHandoff,
      // Kaynak-ayrımlı rehberlik — UI'da N4B vs diğer dökümanlar ayrı kartlarda
      // gösterilir; null ise "bu kaynakta ilgili bilgi yok" diye render edilir.
      ai_n4b_guidance: result.analysis.n4bGuidance ?? null,
      ai_other_docs_guidance: result.analysis.otherDocsGuidance ?? null,
      // Maliyet/telemetri — bu ticket'ı işlemenin Claude API'sine
      // tahmini maliyeti. UI'da TL/USD olarak gösterilir.
      ai_input_tokens: result.analysis.meta.inputTokens,
      ai_output_tokens: result.analysis.meta.outputTokens,
      ai_cost_usd: result.analysis.meta.costUsd,
      ai_model: result.analysis.meta.modelUsed,
      kb_citations: result.kbChunks ? JSON.stringify(result.kbChunks) : null,
    });
    logEvent({
      ticket_id: id,
      actor_id: actor.id,
      event_type: "ai_ran",
      payload: { analysis_id: result.analysisId },
    });
    return Response.json({ ticket: updated });
  } catch (err) {
    return Response.json(
      { error: `AI analizi başarısız: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
