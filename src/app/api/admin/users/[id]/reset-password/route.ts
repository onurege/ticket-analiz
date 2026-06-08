import { z } from "zod";
import {
  requireSuperAdmin,
  hashPassword,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import {
  deleteSessionsForUser,
  getUserById,
  setUserPasswordHash,
} from "@/lib/cc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  password: z.string().min(8).max(200),
});

function authErrorResponse(err: unknown): Response | null {
  if (err instanceof UnauthorizedError) {
    return Response.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return Response.json({ error: err.message }, { status: 403 });
  }
  return null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Geçersiz id" }, { status: 400 });
  }
  const user = getUserById(id);
  if (!user) return Response.json({ error: "Kullanıcı yok" }, { status: 404 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const hash = await hashPassword(parsed.data.password);
  setUserPasswordHash(id, hash);
  // Tüm aktif session'larını sonlandır — yeni parolayla tekrar login olacak
  deleteSessionsForUser(id);

  return Response.json({ ok: true });
}
