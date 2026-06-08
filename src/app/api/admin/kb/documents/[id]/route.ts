import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getKbDb } from "@/lib/kb/db";
import { existsSync, unlinkSync } from "node:fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authError(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

/**
 * DELETE /api/admin/kb/documents/[id]
 * Bir dokümanı KB'den siler (CASCADE chunks + embeddings).
 * Opsiyonel: ?deleteFile=true → orijinal dosyayı da diskten siler.
 */
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authError(err);
    if (r) return r;
    throw err;
  }
  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });
  const url = new URL(req.url);
  const deleteFile = url.searchParams.get("deleteFile") === "true";

  const db = getKbDb();
  const doc = db
    .prepare(`SELECT source_uri FROM kb_documents WHERE doc_id = ?`)
    .get(id) as { source_uri: string | null } | undefined;
  if (!doc) return Response.json({ error: "Doküman yok" }, { status: 404 });

  // Diskten sil (opsiyonel)
  let fileDeleted = false;
  if (deleteFile && doc.source_uri && existsSync(doc.source_uri)) {
    try {
      unlinkSync(doc.source_uri);
      fileDeleted = true;
    } catch (err) {
      console.warn("[kb] dosya silme uyarısı:", (err as Error).message);
    }
  }

  db.prepare(`DELETE FROM kb_documents WHERE doc_id = ?`).run(id);
  return Response.json({ ok: true, deleted_id: id, file_deleted: fileDeleted });
}
