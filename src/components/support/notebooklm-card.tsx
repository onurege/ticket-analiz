"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export type NotebookLmCitation = {
  marker: string;
  number: number;
  sourceName: string;
  sourceText: string;
};

export type NotebookLmAnswer = {
  question: string;
  answer: string;
  sessionId: string | null;
  notebookUrl: string | null;
  sources: NotebookLmCitation[];
  latencyMs: number;
};

export type TicketContext = {
  bildirimNo?: number | null;
  proje?: string | null;
  kategori?: string | null;
  kokNeden?: string | null;
  aciklama?: string | null;
  freeText?: string | null;
};

/**
 * NotebookLM consult kartı — analiz panelinde ticket bağlamıyla
 * "Dökümantasyona Danış" butonu sunar. Kullanıcı tıklayınca
 * /api/notebooklm/consult endpoint'ini çağırır, cevabı ve alıntıları gösterir.
 *
 * Eğer `initial` prop'u (otomatik consult'tan gelen) varsa baştan açık gelir.
 */
export function NotebookLmCard({
  ticket,
  initial,
}: {
  ticket: TicketContext;
  initial?: NotebookLmAnswer | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<NotebookLmAnswer | null>(initial ?? null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [followup, setFollowup] = useState("");

  async function consult(args: {
    sessionId?: string | null;
    followUpQuestion?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const body = args.followUpQuestion
        ? {
            mode: "free" as const,
            question: args.followUpQuestion,
            sessionId: args.sessionId ?? null,
          }
        : {
            mode: "ticket" as const,
            ticket,
            sessionId: args.sessionId ?? null,
          };
      const res = await fetch("/api/notebooklm/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as NotebookLmAnswer | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `API ${res.status}`);
      }
      setAnswer(data);
      setFollowup("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!answer) {
    return (
      <Card tone="accent" padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardHeader>NotebookLM — Univera Dökümantasyonu</CardHeader>
            <CardTitle>Dökümantasyona Danış</CardTitle>
            <p className="text-xs text-fg-2 mt-1 max-w-md">
              Bu ticket için Panorama sürüm notlarına, proje uyarlamalarına
              ve menü adımlarına göre alıntı destekli çözüm önerisi al.
              İlk çağrı 15–60 saniye sürer.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={busy}
            iconLeft={busy ? <Spinner size={12} /> : <Sparkles size={14} />}
            onClick={() => consult({})}
          >
            {busy ? "Danışılıyor…" : "Dökümantasyona Danış"}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-bad mt-3 leading-relaxed">
            <strong>Hata:</strong> {error}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card tone="accent" padding="lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <CardHeader>NotebookLM — Univera Dökümantasyonu</CardHeader>
          <CardTitle>Dökümantasyon Cevabı</CardTitle>
          {answer.latencyMs > 0 && (
            <p className="text-[11px] text-muted mt-0.5">
              {(answer.latencyMs / 1000).toFixed(1)}s · {answer.sources.length}{" "}
              kaynak
            </p>
          )}
        </div>
        <BookOpen size={18} className="text-accent shrink-0 mt-0.5" />
      </div>

      <div className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
        {answer.answer}
      </div>

      {answer.sources.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setSourcesOpen((x) => !x)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Kaynaklar ({answer.sources.length})
          </button>
          {sourcesOpen && (
            <ul className="mt-2 space-y-2 border-t border-border pt-2">
              {answer.sources.map((s) => (
                <li key={s.number} className="text-xs leading-relaxed">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-accent shrink-0">
                      {s.marker}
                    </span>
                    <div>
                      <p className="font-semibold text-fg-1">{s.sourceName}</p>
                      <p className="text-fg-2 mt-0.5">{s.sourceText}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Follow-up question — session_id reuse ile bağlam korunur */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted mb-2">
          Devam Sorusu
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
            disabled={busy}
            placeholder="Bağlamı koruyarak ek soru sor..."
            className="flex-1 text-sm bg-surface border border-border rounded-md px-3 py-1.5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && followup.trim() && !busy) {
                consult({
                  sessionId: answer.sessionId,
                  followUpQuestion: followup.trim(),
                });
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !followup.trim()}
            iconLeft={busy ? <Spinner size={12} /> : undefined}
            onClick={() =>
              consult({
                sessionId: answer.sessionId,
                followUpQuestion: followup.trim(),
              })
            }
          >
            Sor
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-bad mt-3 leading-relaxed">
          <strong>Hata:</strong> {error}
        </p>
      )}
    </Card>
  );
}
