import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getKbDb } from "@/lib/kb/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  const url = new URL(req.url);
  const tenantFilter = url.searchParams.get("tenant");
  const typeFilter = url.searchParams.get("type");

  const db = getKbDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (tenantFilter) {
    where.push("d.tenant_id = ?");
    params.push(tenantFilter);
  }
  if (typeFilter) {
    where.push("d.source_type = ?");
    params.push(typeFilter);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT
        d.doc_id, d.tenant_id, d.source_type, d.source_uri, d.title,
        d.chunk_count, d.token_count, d.ingested_at,
        (SELECT COUNT(*) FROM kb_embeddings e
          JOIN kb_chunks c ON c.chunk_id = e.chunk_id
          WHERE c.doc_id = d.doc_id) AS embedding_count
      FROM kb_documents d
      ${whereSql}
      ORDER BY d.ingested_at DESC
      LIMIT 500
      `,
    )
    .all(...params);

  return Response.json({ documents: rows });
}
