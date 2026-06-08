/*
 * POST /v1/categorize — Bir sorun metnini canonical taksonomi içine kategorize eder.
 *
 * Auth: Bearer token
 * Body: { description, project? }
 * Yanıt:
 *   {
 *     category_id, category_sub,
 *     root_cause_id, root_cause_sub,
 *     confidence, reason
 *   }
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { categorize } from "@/lib/cc/categorizer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  description: z.string().min(5).max(8000),
  project: z.string().max(200).optional(),
  customer_name: z.string().max(200).optional(),
});

export const POST = v1Endpoint(async (req) => {
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
  const result = await categorize({
    description: parsed.data.description,
    project: parsed.data.project ?? null,
    customerName: parsed.data.customer_name ?? null,
  });
  return Response.json(result);
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
