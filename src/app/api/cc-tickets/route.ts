import { z } from "zod";
import {
  requireUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/cc/auth";
import { createTicket, listTickets, type TicketStatus } from "@/lib/cc/store";
import { visibilityFor } from "@/lib/cc/visibility";
// v1 categorizer artık deprecated — kullanılmıyor (bkz. cc-taxonomy-v2)
// import { categorize } from "@/lib/cc/categorizer";
import { categorizeV2 } from "@/lib/cc/categorizer-v2";
import { runAnalysis } from "@/lib/ticket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// AI analizi 15-30s alabilir
export const maxDuration = 120;

const CreateBody = z.object({
  description: z.string().min(5).max(8000),
  customer_name: z.string().max(160).optional(),
  customer_phone: z.string().max(40).optional(),
  customer_email: z.string().email().max(160).optional().or(z.literal("")),
  project: z.string().max(80).optional(),
  channel: z.enum(["phone", "email", "chat", "manual"]).optional(),
  /** "analyze" = AI analizi yap + ticket aç; "quick" = sadece kayıt aç */
  mode: z.enum(["analyze", "quick"]).default("analyze"),
  // Manuel açılış seçimleri — eğer verilirse AI v2 categorizer bypass edilir
  // (ajan zaten seçmiş, override etme). null/undefined ise AI çalışır.
  open_urun: z.string().nullable().optional(),
  open_platform: z.string().nullable().optional(),
  open_is_sureci: z.string().nullable().optional(),
  open_islem_tipi: z.string().nullable().optional(),
  open_etkilenen_nesne: z.string().nullable().optional(),
  open_etki: z.string().nullable().optional(),
});

const STATUS_VALUES: TicketStatus[] = [
  "open",
  "in_progress",
  "escalated",
  "resolved",
  "closed",
];

const ListQuery = z.object({
  status: z
    .union([
      z.enum(STATUS_VALUES as [TicketStatus, ...TicketStatus[]]),
      z.array(
        z.enum(STATUS_VALUES as [TicketStatus, ...TicketStatus[]]),
      ),
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

function authErrorResponse(err: unknown): Response | null {
  if (err instanceof UnauthorizedError)
    return Response.json({ error: err.message }, { status: 401 });
  if (err instanceof ForbiddenError)
    return Response.json({ error: err.message }, { status: 403 });
  return null;
}

// ─── GET /api/cc-tickets — liste (rol-aware) ──────────────────────────────

export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    const r = authErrorResponse(err);
    if (r) return r;
    throw err;
  }

  const url = new URL(req.url);
  const rawStatus = url.searchParams.getAll("status");
  const parsed = ListQuery.safeParse({
    status: rawStatus.length === 0 ? undefined : rawStatus,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz parametre", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const vis = visibilityFor(user);
  const { rows, total } = listTickets({
    whereSql: vis.whereSql,
    whereParams: vis.whereParams,
    status: parsed.data.status,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });

  return Response.json({
    tickets: rows,
    total,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });
}

// ─── POST /api/cc-tickets — yeni ticket ───────────────────────────────────

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
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
  const body = parsed.data;

  // 1) Otomatik açılış kategorizasyonu (v2).
  //    Ajan formda en az bir açılış alanı verdiyse SKIP edilir — manuel
  //    seçim AI'yi override eder. Tamamen boşsa AI çalışır.
  //    v1 (eski cc-taxonomy.json şeması) artık çağrılmıyor — deprecated.
  type V2 = Awaited<ReturnType<typeof categorizeV2>>;
  const manualOpen = {
    urun: body.open_urun ?? null,
    platform: body.open_platform ?? null,
    is_sureci: body.open_is_sureci ?? null,
    islem_tipi: body.open_islem_tipi ?? null,
    etkilenen_nesne: body.open_etkilenen_nesne ?? null,
    etki: body.open_etki ?? null,
  };
  const hasManualOpen = Object.values(manualOpen).some((v) => v != null);

  let openV2: V2 | null = null;
  let openV2Error: string | null = null;
  if (!hasManualOpen) {
    try {
      openV2 = await categorizeV2({
        description: body.description,
        project: body.project ?? null,
        customerName: body.customer_name ?? null,
      });
    } catch (err) {
      openV2Error = (err as Error).message;
      console.error("[cc] categorize v2 başarısız:", err);
    }
  }

  // 2) Eğer mode = analyze ise full runAnalysis çalıştır
  let analysisResult: Awaited<ReturnType<typeof runAnalysis>> | null = null;
  let analyzeError: string | null = null;
  if (body.mode === "analyze") {
    try {
      analysisResult = await runAnalysis({
        freeText: body.description,
        project: body.project,
      });
    } catch (err) {
      analyzeError = (err as Error).message;
      console.error("[cc] runAnalysis başarısız:", err);
    }
  }

  // 3) Ticket'ı oluştur
  const ticket = createTicket({
    description: body.description,
    customer_name: body.customer_name ?? null,
    customer_phone: body.customer_phone ?? null,
    customer_email: body.customer_email || null,
    project: body.project ?? null,
    channel: body.channel ?? "manual",
    opened_by: user.id,
    // v1 sınıflandırma alanları artık yazılmıyor — deprecated.
    // Eski ticket'lardaki değerler korunur ama yeni ticket'larda null.
    category_id: null,
    category_sub: null,
    root_cause_id: null,
    root_cause_sub: null,
    category_reason: null,
    analysis_id: analysisResult?.analysisId ?? null,
    ai_ran: analysisResult !== null,
    ai_root_cause: analysisResult
      ? JSON.stringify(analysisResult.analysis.rootCauseHypotheses)
      : null,
    ai_steps: analysisResult
      ? JSON.stringify(analysisResult.analysis.suggestedSteps)
      : null,
    ai_customer_reply: analysisResult?.analysis.customerReplyDraft ?? null,
    ai_handoff: analysisResult?.analysis.engineeringHandoff ?? null,
    ai_n4b_guidance: analysisResult?.analysis.n4bGuidance ?? null,
    ai_other_docs_guidance: analysisResult?.analysis.otherDocsGuidance ?? null,
    ai_input_tokens: analysisResult?.analysis.meta.inputTokens ?? null,
    ai_output_tokens: analysisResult?.analysis.meta.outputTokens ?? null,
    ai_cost_usd: analysisResult?.analysis.meta.costUsd ?? null,
    ai_model: analysisResult?.analysis.meta.modelUsed ?? null,
    // v2 açılış sınıflandırması — manuel girilen değerler AI'yi override eder.
    // hasManualOpen true ise openV2 null'dır; aksi halde AI sonucundan al.
    open_urun: manualOpen.urun ?? openV2?.urun ?? null,
    open_platform: manualOpen.platform ?? openV2?.platform ?? null,
    open_is_sureci: manualOpen.is_sureci ?? openV2?.is_sureci ?? null,
    open_islem_tipi: manualOpen.islem_tipi ?? openV2?.islem_tipi ?? null,
    open_etkilenen_nesne:
      manualOpen.etkilenen_nesne ?? openV2?.etkilenen_nesne ?? null,
    open_etki: manualOpen.etki ?? openV2?.etki ?? null,
    kb_citations: analysisResult?.kbChunks
      ? JSON.stringify(analysisResult.kbChunks)
      : null,
  });

  return Response.json(
    {
      ticket,
      warnings: {
        categorize: openV2Error,
        analyze: analyzeError,
      },
    },
    { status: 201 },
  );
}
