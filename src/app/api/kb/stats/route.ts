import { kbStats } from "@/lib/kb/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(kbStats());
  } catch (err) {
    return Response.json(
      { error: (err as Error)?.message ?? "bilinmeyen hata" },
      { status: 500 },
    );
  }
}
