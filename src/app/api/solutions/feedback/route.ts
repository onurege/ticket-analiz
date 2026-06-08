import { z } from "zod";
import { randomBytes } from "node:crypto";
import { appendFeedback, loadAnalysis, writeHandoff } from "@/lib/ticket/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  analysisId: z.string().min(3),
  verdict: z.enum(["solved", "not_solved", "escalate_engineering"]),
  note: z.string().max(2000).optional(),
  appliedSolutionId: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { analysisId, verdict, note, appliedSolutionId } = parsed.data;

  const feedbackId = `fb-${randomBytes(4).toString("hex")}`;
  appendFeedback({
    feedbackId,
    analysisId,
    verdict,
    note,
    appliedSolutionId,
    createdAt: new Date().toISOString(),
  });

  let handoffPath: string | null = null;
  if (verdict === "escalate_engineering") {
    const rec = loadAnalysis(analysisId);
    if (rec) {
      const md = buildHandoffMarkdown(rec, note);
      handoffPath = writeHandoff(analysisId, md);
    }
  }

  return Response.json({ ok: true, feedbackId, handoffPath });
}

function buildHandoffMarkdown(
  rec: { meta: { analysisId: string; bildirimNo: number | null; category: string | null; severity: string | null; createdAt: string }; analysis: unknown },
  note: string | undefined,
): string {
  const a = rec.analysis as {
    engineeringHandoff?: string;
    suggestedBugGroup?: string | null;
    suggestedTfsTip?: string | null;
    rootCauseHypotheses?: Array<{ text: string; confidence: number }>;
    suggestedSteps?: Array<{ step: string; rationale?: string | null }>;
  };
  const lines = [
    `# Handoff — ${rec.meta.analysisId}`,
    ``,
    `**Bildirim_No:** ${rec.meta.bildirimNo ?? "—"}`,
    `**Kategori:** ${rec.meta.category ?? "—"}`,
    `**Severity:** ${rec.meta.severity ?? "—"}`,
    `**Tarih:** ${rec.meta.createdAt}`,
    ``,
    `## Teknik Özet`,
    a.engineeringHandoff ?? "(yok)",
    ``,
    `## Öneriler`,
    `- **BugGroup:** ${a.suggestedBugGroup ?? "—"}`,
    `- **TfsTip:** ${a.suggestedTfsTip ?? "—"}`,
    ``,
    `## Kök Neden Hipotezleri`,
    ...(a.rootCauseHypotheses ?? []).map(
      (h, i) => `${i + 1}. (%${Math.round(h.confidence * 100)}) ${h.text}`,
    ),
    ``,
    `## Uygulanan / Önerilen Adımlar`,
    ...(a.suggestedSteps ?? []).map((s, i) => `${i + 1}. ${s.step}`),
    ``,
  ];
  if (note) {
    lines.push(`## Destek Notu`, note, ``);
  }
  return lines.join("\n");
}
