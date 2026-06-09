/*
 * POST /v1/suggest-close — Kapanış önerisi (4 alan).
 *
 * Bir ticket için sorun açıklaması + ajan'ın yazdığı çözüm taslağını alır,
 * destek dili kapanış alanlarını AI ile önerir:
 *   - kok_neden_grubu (12 grup)
 *   - kok_neden_detayi (grubun alt detayı)
 *   - cozum_tipi (12 çözüm tipi)
 *   - kalici_onlem (8 önlem, opsiyonel)
 *
 * Açılış sınıflandırması (urun/is_sureci/islem_tipi) verilirse bağlam olarak
 * kullanılır — değerlendirmeyi etkilemiyor ama tutarlılığı arttırır.
 */

import { z } from "zod";
import { v1Endpoint } from "@/lib/api/handler";
import { apiErrorResponse } from "@/lib/api/auth";
import { suggestClose } from "@/lib/cc/categorizer-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  description: z.string().min(5).max(8000),
  resolution: z.string().min(5).max(20000),
  open_urun: z.string().max(100).nullable().optional(),
  open_is_sureci: z.string().max(200).nullable().optional(),
  open_islem_tipi: z.string().max(200).nullable().optional(),
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
  const result = await suggestClose({
    description: parsed.data.description,
    resolution: parsed.data.resolution,
    open_urun: parsed.data.open_urun ?? null,
    open_is_sureci: parsed.data.open_is_sureci ?? null,
    open_islem_tipi: parsed.data.open_islem_tipi ?? null,
  });
  return Response.json(result);
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
