/*
 * POST /v1/analyze — Tam ticket analizi (kategorize + AI önerileri + KB grounding).
 *
 * Auth: Bearer token
 * Body: { freeText (zorunlu), project?, bildirimNo? }
 * Yanıt: AnalyzeResult — root cause, suggested steps, customer reply, KB chunks
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { runAnalysis, AnalyzeBodySchema } from "@/lib/ticket";
import { CustomerSearchBlockedError } from "@/lib/ticket/anonymizer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 180;

export const POST = v1Endpoint(async (req) => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse("Geçersiz JSON", 400);
  }
  const parsed = AnalyzeBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse("Geçersiz girdi", 400, parsed.error.issues);
  }
  try {
    const result = await runAnalysis(parsed.data);
    return Response.json(result);
  } catch (err) {
    if (err instanceof CustomerSearchBlockedError) {
      return apiErrorResponse(
        "Müşteri bazlı arama desteklenmiyor. Lütfen sorunu teknik terimlerle ifade edin.",
        400,
        { blockedMatches: err.matches },
      );
    }
    return apiErrorResponse(
      `Analiz hatası: ${(err as Error).message}`,
      500,
    );
  }
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));

void z; // import keep
