import { AnalyzeBodySchema, runAnalysis } from "@/lib/ticket";
import { CustomerSearchBlockedError } from "@/lib/ticket/anonymizer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON gövde." }, { status: 400 });
  }

  const parsed = AnalyzeBodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await runAnalysis(parsed.data);
    return Response.json(result);
  } catch (err) {
    if (err instanceof CustomerSearchBlockedError) {
      return Response.json(
        {
          error: "Müşteri bazlı arama desteklenmiyor.",
          detail:
            "Sorgunuzda müşteri/firma adı tespit edildi. Lütfen sorunu teknik" +
            " terimlerle ifade edin (örn. 'fatura gönderim hatası', 'irsaliye birleştirme').",
          blockedMatches: err.matches,
        },
        { status: 400 },
      );
    }
    console.error("analyze error:", err);
    const msg = (err as Error).message ?? "bilinmeyen hata";
    return Response.json({ error: msg }, { status: 500 });
  }
}
