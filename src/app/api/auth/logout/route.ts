import { endSession } from "@/lib/cc/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await endSession();
  return Response.json({ ok: true });
}
