import { z } from "zod";
import { searchSolutions, listSolutions } from "@/lib/ticket/solutions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const QuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz parametre", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { q, limit } = parsed.data;
  const results = q ? searchSolutions(q, limit) : listSolutions().slice(0, limit);
  return Response.json({ results });
}

const PostBody = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  severity: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = PostBody.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { saveSolution } = await import("@/lib/ticket/solutions");
  const sol = saveSolution(parsed.data);
  return Response.json({ ok: true, solution: sol });
}
