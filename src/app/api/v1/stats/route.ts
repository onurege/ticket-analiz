/*
 * GET /v1/stats — Detaylı KB istatistikleri.
 *
 * Auth: Bearer token
 * Yanıt: doc/chunk/embed sayıları, tenant-spesifik filtrelenmiş.
 */

import { v1Endpoint } from "@/lib/api/handler";
import { getKbDb } from "@/lib/kb/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = v1Endpoint(async (_req, caller) => {
  const db = getKbDb();

  const docs = db
    .prepare(
      `SELECT COUNT(*) AS n FROM kb_documents WHERE tenant_id = ?`,
    )
    .get(caller.tenantId) as { n: number };

  const chunks = db
    .prepare(
      `SELECT COUNT(*) AS n FROM kb_chunks WHERE tenant_id = ?`,
    )
    .get(caller.tenantId) as { n: number };

  const embeds = db
    .prepare(
      `SELECT COUNT(*) AS n FROM kb_embeddings e
       JOIN kb_chunks c ON c.chunk_id = e.chunk_id
       WHERE c.tenant_id = ?`,
    )
    .get(caller.tenantId) as { n: number };

  const byType = db
    .prepare(
      `SELECT source_type, COUNT(*) AS n FROM kb_documents
       WHERE tenant_id = ?
       GROUP BY source_type`,
    )
    .all(caller.tenantId) as Array<{ source_type: string; n: number }>;

  const lastIngest = db
    .prepare(
      `SELECT MAX(ingested_at) AS t FROM kb_documents WHERE tenant_id = ?`,
    )
    .get(caller.tenantId) as { t: string | null };

  return Response.json({
    tenant: caller.tenantId,
    documents: docs.n,
    chunks: chunks.n,
    embeddings: embeds.n,
    embedding_coverage: chunks.n > 0 ? embeds.n / chunks.n : 0,
    by_type: Object.fromEntries(byType.map((r) => [r.source_type, r.n])),
    last_ingest_at: lastIngest.t,
  });
});

export const OPTIONS = v1Endpoint(async () => new Response(null, { status: 204 }));
