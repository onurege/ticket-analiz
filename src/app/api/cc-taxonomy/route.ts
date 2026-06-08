/*
 * GET /api/cc-taxonomy — yeni 2-fazlı sınıflandırma şeması.
 * UI dropdown'larını dolduran sade JSON. Auth gerek (cookie'li session var mı).
 */
import { loadTaxonomyV2 } from "@/lib/cc/taxonomy-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const t = loadTaxonomyV2();
  return Response.json(t, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
