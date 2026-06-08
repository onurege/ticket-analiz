"use client";

import { useState } from "react";
import { TicketInput, type AnalyzeBodyPayload } from "@/components/support/ticket-input";
import { AnalysisPanel, type AnalyzeApiResult } from "@/components/support/analysis-panel";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function SupportHome() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: AnalyzeBodyPayload) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tickets/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as AnalyzeApiResult | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `API ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bildirim Analizi</h1>
        <p className="text-sm text-muted mt-1">
          Bildirim numarası veya serbest metinle analiz başlat. Sonuç paneli
          benzer geçmiş kayıtları, çözüm adımlarını ve müşteri yanıt taslağını
          içerir.
        </p>
      </div>

      <TicketInput busy={busy} onSubmit={submit} />

      {busy && (
        <Card padding="lg" tone="muted">
          <div className="flex items-center gap-3 text-sm text-fg-2">
            <Spinner size={18} />
            Analiz yapılıyor… benzer kayıt taraması + Gemini analist çağrısı.
          </div>
        </Card>
      )}

      {error && (
        <Card padding="lg" tone="bad">
          <p className="text-sm">
            <strong className="font-semibold">Hata: </strong>
            {error}
          </p>
          <p className="text-xs text-muted mt-2">
            İpucu: GEMINI_API_KEY ayarlı mı? Embedding cache (sync-and-embed)
            dolu mu? View'da kayıt var mı?
          </p>
        </Card>
      )}

      {result && <AnalysisPanel result={result} />}
    </div>
  );
}
