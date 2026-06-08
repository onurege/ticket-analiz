import { z } from "zod";
import {
  requireSuperAdmin,
  hashPassword,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import {
  ALL_ROLES,
  createUser,
  getUserByEmail,
  listUsers,
  type CcRole,
} from "@/lib/cc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RoleSchema = z.enum(ALL_ROLES as [CcRole, ...CcRole[]]);

const CreateBody = z.object({
  email: z.string().email(),
  name: z
    .string()
    .min(2)
    .max(120)
    .refine((s) => !/^\d+$/.test(s), {
      message:
        "Ad Soyad sadece rakamdan oluşamaz. Parolanızı yanlışlıkla buraya yazdıysanız 'Parola' alanını kullanın.",
    })
    .refine((s) => /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(s), {
      message: "Ad Soyad en az bir harf içermeli.",
    }),
  role: RoleSchema,
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

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }
  return Response.json({ users: listUsers() });
}

export async function POST(req: Request) {
  let actor;
  try {
    actor = await requireSuperAdmin();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = CreateBody.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { email, name, role, password } = parsed.data;

  if (getUserByEmail(email)) {
    return Response.json(
      { error: "Bu e-posta zaten kayıtlı." },
      { status: 409 },
    );
  }

  const password_hash = await hashPassword(password);
  const user = createUser({
    email,
    name,
    role,
    password_hash,
    created_by: actor.id,
  });

  return Response.json({ user }, { status: 201 });
}
