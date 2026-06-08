/*
 * POST /v1/kb/ask — Halisünasyon-savar RAG generation.
 *
 * Auth: Bearer token (Authorization header)
 * Body:
 *   {
 *     "query": "soru metni",
 *     "topK": 8,                   // opsiyonel, default 8
 *     "rerank": true,              // opsiyonel, default true
 *     "verify": true,              // opsiyonel, default true
 *     "strictness": "normal",      // opsiyonel: lenient|normal|strict
 *     "sourceTypes": ["pdf"]       // opsiyonel filter
 *   }
 *
 * Yanıt:
 *   {
 *     "query": "...",
 *     "answer": "markdown cevap [1][2]",
 *     "citations": [...],
 *     "refused": false,
 *     "reason": null,
 *     "meta": { totalLatencyMs, modelUsed, ... }
 *   }
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { ask } from "@/lib/kb/ask";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  query: z.string().min(3).max(2000),
  topK: z.number().int().min(1).max(20).optional(),
  rerank: z.boolean().optional(),
  verify: z.boolean().optional(),
  strictness: z.enum(["lenient", "normal", "strict"]).optional(),
  sourceTypes: z
    .array(z.enum(["pdf", "panorama_screen", "ticket_resolution"]))
    .optional(),
});

export const POST = v1Endpoint(async (req, caller) => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse("Geçersiz JSON gövde.", 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse("Geçersiz girdi", 400, parsed.error.issues);
  }
  const result = await ask(parsed.data.query, {
    topK: parsed.data.topK ?? 8,
    rerank: parsed.data.rerank ?? true,
    verify: parsed.data.verify ?? true,
    strictness: parsed.data.strictness ?? "normal",
    sourceTypes: parsed.data.sourceTypes,
    tenantId: caller.tenantId,
  });
  return Response.json(result);
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
