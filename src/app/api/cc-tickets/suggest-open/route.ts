/*
 * POST /api/cc-tickets/suggest-open
 * Body: { description, project?, customer_name? }
 *
 * Açıklama metnini v2 categorizer'a verir, 5 açılış alanını döner.
 * Form pre-fill için: ajan açıklamayı yazar, butona basar, dropdown'lar
 * dolar; ajan istediğini değiştirip ticket'ı oluşturur.
 */
import { z } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/cc/auth";
import { categorizeV2 } from "@/lib/cc/categorizer-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  description: z.string().min(5).max(4000),
  project: z.string().nullable().optional(),
  customer_name: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return Response.json({ error: err.message }, { status: 401 });
    throw err;
  }

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

  try {
    const result = await categorizeV2({
      description: parsed.data.description,
      project: parsed.data.project ?? null,
      customerName: parsed.data.customer_name ?? null,
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: `Öneri başarısız: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
