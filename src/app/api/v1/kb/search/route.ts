/*
 * POST /v1/kb/search — Sadece retrieval (generation yok, debug/recall test için).
 *
 * Auth: Bearer token
 * Body: { query, topK?, rerank?, sourceTypes? }
 * Yanıt: { query, hits: [{ chunk_id, doc_id, title, content, ... }] }
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { retrieve } from "@/lib/kb/retrieve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  query: z.string().min(2).max(2000),
  topK: z.number().int().min(1).max(50).optional(),
  rerank: z.boolean().optional(),
  sourceTypes: z
    .array(z.enum(["pdf", "panorama_screen", "ticket_resolution"]))
    .optional(),
});

export const POST = v1Endpoint(async (req, caller) => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse("Geçersiz JSON", 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse("Geçersiz girdi", 400, parsed.error.issues);
  }
  const hits = await retrieve(parsed.data.query, {
    topK: parsed.data.topK ?? 10,
    rerank: parsed.data.rerank ?? false,
    sourceTypes: parsed.data.sourceTypes,
    tenantId: caller.tenantId,
  });
  return Response.json({ query: parsed.data.query, hits });
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
