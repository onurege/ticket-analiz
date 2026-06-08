/*
 * GET /v1/health — health probe.
 *
 * Auth gerektirmez (public). Ama sadece yüzeysel kontrol — derin kontrol için
 * /v1/stats kullan (auth gerekir).
 */

import { corsPreflight, applyCorsHeaders } from "@/lib/api/cors";
import { isVecAvailable, kbStats } from "@/lib/kb/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return corsPreflight(req.headers.get("origin"));
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  try {
    const stats = kbStats();
    const body = {
      ok: true,
      version: "v1",
      kb: {
        documents: stats.documents,
        chunks: stats.chunks,
        embeddings: stats.embeddings,
        vec_available: stats.vecAvailable,
      },
      timestamp: new Date().toISOString(),
    };
    return applyCorsHeaders(Response.json(body), origin);
  } catch (err) {
    return applyCorsHeaders(
      Response.json(
        {
          ok: false,
          error: (err as Error).message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      ),
      origin,
    );
  }
}

void isVecAvailable; // import keep
