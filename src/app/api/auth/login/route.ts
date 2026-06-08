import { z } from "zod";
import {
  startSession,
  verifyPassword,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { getUserByEmail } from "@/lib/cc/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
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
  const { email, password } = parsed.data;

  const user = getUserByEmail(email);
  if (!user) {
    // Timing attack'ı önlemek için yine de bcrypt çalıştır
    await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval");
    return Response.json({ error: "E-posta veya parola hatalı." }, { status: 401 });
  }
  if (user.active !== 1) {
    return Response.json({ error: "Hesabınız devre dışı." }, { status: 403 });
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return Response.json({ error: "E-posta veya parola hatalı." }, { status: 401 });
  }

  const userAgent = req.headers.get("user-agent") ?? null;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  try {
    await startSession(user.id, { userAgent, ip });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
