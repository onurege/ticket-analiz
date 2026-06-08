/*
 * POST /api/admin/kb/embed — Bekleyen chunk'lar için embedding üret.
 * Long-running operasyon (max 10 dakika); büyük yığınlar için CLI tercih edin.
 */

import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { embedPendingChunks } from "@/lib/kb/embedder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  let body: { maxChunks?: number; batchSize?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // boş body OK
  }
  const result = await embedPendingChunks({
    batchSize: body.batchSize ?? 16,
    maxChunks: body.maxChunks ?? 5000,
  });
  return Response.json(result);
}
