/*
 * POST /v1/categorize-v2 — Açılış sınıflandırması (6 alan).
 *
 * Yeni 2-fazlı taksonomi (cc-taxonomy-v2.json) — açılış fazı.
 * urun, platform, is_sureci, islem_tipi, etkilenen_nesne, etki alanlarını
 * doldurur. Kapanış (kok_neden / cozum_tipi / kalici_onlem) ayrı endpoint:
 * /v1/suggest-close.
 *
 * v1/categorize (eski, kategori_id/root_cause) ile karıştırma — bu daha
 * granüler ve müşteri diline yakın.
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { categorizeV2 } from "@/lib/cc/categorizer-v2";

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
  const result = await categorizeV2({
    description: parsed.data.description,
    project: parsed.data.project ?? null,
    customerName: parsed.data.customer_name ?? null,
  });
  return Response.json(result);
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
