import { z } from "zod";
import {
  consultForTicket,
  consultFreeQuestion,
  isNotebookLmEnabled,
  NotebookLmDisabledError,
  type NotebookLmAnswer,
} from "@/lib/ticket/notebooklm";
import { callTool, extractTextPayload } from "@/lib/notebooklm/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// NotebookLM çağrıları 15-60s alabilir; Next default 10s'lik fonksiyonda
// timeout ısırır. nodejs runtime'da en üst sınıra çıkar.
export const maxDuration = 120;

const TicketContextSchema = z.object({
  bildirimNo: z.number().int().positive().nullable().optional(),
  proje: z.string().nullable().optional(),
  kategori: z.string().nullable().optional(),
  kokNeden: z.string().nullable().optional(),
  aciklama: z.string().nullable().optional(),
  freeText: z.string().nullable().optional(),
});

const Body = z
  .object({
    mode: z.enum(["ticket", "free"]),
    sessionId: z.string().nullable().optional(),
    ticket: TicketContextSchema.optional(),
    question: z.string().min(3).optional(),
  })
  .superRefine((b, ctx) => {
    if (b.mode === "ticket" && !b.ticket) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ticket alanı zorunlu (mode=ticket)",
        path: ["ticket"],
      });
    }
    if (b.mode === "free" && !b.question) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "question alanı zorunlu (mode=free)",
        path: ["question"],
      });
    }
  });

export async function POST(req: Request) {
  if (!isNotebookLmEnabled()) {
    return Response.json(
      {
        error:
          "NotebookLM devre dışı. .env içinde NOTEBOOKLM_ENABLED=true ve NOTEBOOKLM_NOTEBOOK_ID (veya _URL) ayarlanmalı.",
      },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Geçersiz JSON gövde." }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "Geçersiz girdi", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    let answer: NotebookLmAnswer;
    if (parsed.data.mode === "ticket") {
      answer = await consultForTicket(parsed.data.ticket!, {
        sessionId: parsed.data.sessionId ?? null,
      });
    } else {
      answer = await consultFreeQuestion(parsed.data.question!, {
        sessionId: parsed.data.sessionId ?? null,
      });
    }
    return Response.json(answer);
  } catch (err) {
    if (err instanceof NotebookLmDisabledError) {
      return Response.json({ error: err.message }, { status: 503 });
    }
    const msg = (err as Error)?.message ?? "bilinmeyen hata";
    console.error("notebooklm consult error:", err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Health probe — subprocess'in auth durumunu da içerir. Hata ayıklamada
  // "authenticated=true" ama yine "chat input bulunamadı" gelirse bilgi farkı
  // / profile collision olduğunu gösterir.
  const enabled = isNotebookLmEnabled();
  if (!enabled) {
    return Response.json({ enabled: false });
  }
  try {
    const raw = await callTool("get_health", {}, { timeoutMs: 15000 });
    const payload = extractTextPayload(raw) as
      | { data?: Record<string, unknown> }
      | null;
    return Response.json({
      enabled,
      health: payload?.data ?? null,
    });
  } catch (err) {
    return Response.json({
      enabled,
      health: null,
      error: (err as Error)?.message,
    });
  }
}
