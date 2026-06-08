import { z } from "zod";
import {
  requireSuperAdmin,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import {
  ALL_ROLES,
  deactivateUser,
  deleteSessionsForUser,
  getUserById,
  updateUser,
  type CcRole,
} from "@/lib/cc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RoleSchema = z.enum(ALL_ROLES as [CcRole, ...CcRole[]]);

const PatchBody = z.object({
  name: z
    .string()
    .min(2)
    .max(120)
    .refine((s) => !/^\d+$/.test(s), {
      message:
        "Ad Soyad sadece rakamdan oluşamaz. Parolanızı yanlışlıkla buraya yazdıysanız 'Parola Sıfırla' butonunu kullanın.",
    })
    .refine((s) => /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(s), {
      message: "Ad Soyad en az bir harf içermeli.",
    })
    .optional(),
  role: RoleSchema.optional(),
  active: z
    .union([z.boolean(), z.number().int().min(0).max(1)])
    .transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : (v as 0 | 1)))
    .optional(),
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

function parseId(idStr: string): number | null {
  const n = Number(idStr);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _req: Request,
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
  const id = parseId(idStr);
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });
  const user = getUserById(id);
  if (!user) return Response.json({ error: "Kullanıcı yok" }, { status: 404 });
  return Response.json({ user });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireSuperAdmin();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Kendini super_admin olmaktan çıkarmaya / kendini devre dışı bırakmaya engel
  if (actor.id === id) {
    if (parsed.data.role && parsed.data.role !== "super_admin") {
      return Response.json(
        { error: "Kendi rolünüzü düşüremezsiniz." },
        { status: 400 },
      );
    }
    if (parsed.data.active === 0) {
      return Response.json(
        { error: "Kendinizi devre dışı bırakamazsınız." },
        { status: 400 },
      );
    }
  }

  const updated = updateUser(id, parsed.data);
  if (!updated)
    return Response.json({ error: "Kullanıcı yok" }, { status: 404 });

  // Devre dışı bırakıldıysa session'larını temizle (anında logout)
  if (parsed.data.active === 0) deleteSessionsForUser(id);

  return Response.json({ user: updated });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireSuperAdmin();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }
  const { id: idStr } = await ctx.params;
  const id = parseId(idStr);
  if (!id) return Response.json({ error: "Geçersiz id" }, { status: 400 });
  if (actor.id === id) {
    return Response.json(
      { error: "Kendinizi silemezsiniz." },
      { status: 400 },
    );
  }
  // Soft delete — kayıtları korumak için sadece deaktive edelim
  deactivateUser(id);
  deleteSessionsForUser(id);
  return Response.json({ ok: true });
}
