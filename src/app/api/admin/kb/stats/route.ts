import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getKbDb, isVecAvailable } from "@/lib/kb/db";
import { statSync, existsSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }

  const db = getKbDb();
  const docs = (db.prepare(`SELECT COUNT(*) AS n FROM kb_documents`).get() as { n: number }).n;
  const chunks = (db.prepare(`SELECT COUNT(*) AS n FROM kb_chunks`).get() as { n: number }).n;
  const embeds = (db.prepare(`SELECT COUNT(*) AS n FROM kb_embeddings`).get() as { n: number }).n;
  const byType = db
    .prepare(`SELECT source_type, COUNT(*) AS n FROM kb_documents GROUP BY source_type`)
    .all() as Array<{ source_type: string; n: number }>;
  const lastIngest = (db
    .prepare(`SELECT MAX(ingested_at) AS t FROM kb_documents`)
    .get() as { t: string | null }).t;
  const byTenant = db
    .prepare(`SELECT tenant_id, COUNT(*) AS n FROM kb_documents GROUP BY tenant_id`)
    .all() as Array<{ tenant_id: string; n: number }>;

  // Disk kullanımı
  const dbPath = path.resolve(process.cwd(), "data/embeddings.sqlite");
  let dbSize = 0;
  if (existsSync(dbPath)) {
    dbSize = statSync(dbPath).size;
  }

  return Response.json({
    documents: docs,
    chunks,
    embeddings: embeds,
    embedding_coverage: chunks > 0 ? embeds / chunks : 0,
    by_type: Object.fromEntries(byType.map((r) => [r.source_type, r.n])),
    by_tenant: Object.fromEntries(byTenant.map((r) => [r.tenant_id, r.n])),
    last_ingest_at: lastIngest,
    db_size_bytes: dbSize,
    db_size_mb: Math.round((dbSize / 1024 / 1024) * 10) / 10,
    vec_available: isVecAvailable(),
  });
}
