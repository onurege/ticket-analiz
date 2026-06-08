import { currentUser } from "@/lib/cc/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Mevcut auth durumu — UI navbar'ı için.
 * 200 + user veya 200 + null (login olmayan kullanıcılar için sessizce null).
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
