"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type SourceType = "pdf" | "panorama_screen" | "ticket_resolution";

export type KbCitation = {
  number: number;
  chunk_id: number;
  doc_id: string;
  source_type: SourceType;
  title: string | null;
  heading_path: string | null;
  excerpt: string;
};

export type KbAskResult = {
  query: string;
  answer: string;
  citations: KbCitation[];
  refused: boolean;
  reason: string | null;
  meta: {
    retrievalLatencyMs: number;
    generationLatencyMs: number;
    verifierLatencyMs: number;
    totalLatencyMs: number;
    modelUsed: string;
    rerankUsed: boolean;
    verifierUsed: boolean;
  };
};

export type TicketContext = {
  bildirimNo?: number | null;
  proje?: string | null;
  kategori?: string | null;
  kokNeden?: string | null;
  aciklama?: string | null;
  freeText?: string | null;
};

function buildDefaultQuery(ctx: TicketContext): string {
  const aciklama = ctx.freeText ?? ctx.aciklama ?? "";
  const parts: string[] = [];
  if (ctx.kategori) parts.push(ctx.kategori);
  if (ctx.kokNeden) parts.push(ctx.kokNeden);
  if (aciklama) parts.push(aciklama.slice(0, 500));
  return parts.join(" — ") || "Panorama hakkında genel bilgi";
}

const SOURCE_LABEL: Record<SourceType, string> = {
  pdf: "PDF",
  panorama_screen: "Ekran",
  ticket_resolution: "Geçmiş Çözüm",
};

const SOURCE_TONE: Record<SourceType, "accent" | "warn" | "good"> = {
  pdf: "accent",
  panorama_screen: "warn",
  ticket_resolution: "good",
};

export function KnowledgeBaseCard({ ticket }: { ticket: TicketContext }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KbAskResult | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);

  async function consult(query: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/kb/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          topK: 12,
          rerank: true,
          verify: true,
          strictness: "lenient",
        }),
      });
      const data = (await res.json()) as KbAskResult | { error: string };
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

  // İlk durum: buton göster
  if (!result) {
    return (
      <Card tone="accent" padding="lg">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <CardHeader>Bilgi Bankası — Univera Panorama</CardHeader>
            <CardTitle>Dökümantasyona Danış</CardTitle>
            <p className="text-xs text-fg-2 mt-1 max-w-md">
              PDF dökümantasyon, ekran kılavuzları ve geçmiş çözüm kayıtlarını
              tarayıp alıntılı çözüm önerisi getir. Halisünasyon-savar:
              kaynaklarda yoksa "bilgi yok" der.
            </p>
          </div>
          <Database size={20} className="text-accent shrink-0 mt-0.5" />
        </div>

        <div className="flex gap-2 items-center">
          {!customMode ? (
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              iconLeft={busy ? <Spinner size={12} /> : <Sparkles size={14} />}
              onClick={() => consult(buildDefaultQuery(ticket))}
            >
              {busy ? "Aranıyor…" : "Bilgi Bankasında Ara"}
            </Button>
          ) : (
            <>
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Özel sorgu yaz..."
                className="flex-1 text-sm bg-surface border border-border rounded-md px-3 py-1.5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customQuery.trim() && !busy) {
                    consult(customQuery.trim());
                  }
                }}
              />
              <Button
                variant="primary"
                size="sm"
                disabled={busy || !customQuery.trim()}
                onClick={() => consult(customQuery.trim())}
              >
                Ara
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCustomMode((x) => !x)}
          >
            {customMode ? "İptal" : "Özel sorgu"}
          </Button>
        </div>

        {error && (
          <p className="text-xs text-bad mt-3">
            <strong>Hata:</strong> {error}
          </p>
        )}
      </Card>
    );
  }

  // Refused: kaynak yetersiz → uyarı kartı
  if (result.refused) {
    return (
      <Card tone="warn" padding="lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-warn shrink-0 mt-0.5" />
          <div className="flex-1">
            <CardHeader>Bilgi Bankası — Kaynak Yetersiz</CardHeader>
            <CardTitle>Doğrulanabilir cevap üretilemedi</CardTitle>
            <p className="text-sm text-fg-2 mt-2 leading-relaxed">
              {result.reason ??
                "Bilgi bankasında bu konuyla ilgili yeterli kaynak bulunamadı."}
            </p>
            <p className="text-[11px] text-muted mt-2">
              Bu sistem halisünasyondan kaçınmak için bilgisi olmadığında
              "bilmiyorum" der. Daha fazla doküman ingest edin veya sorguyu
              değiştirin.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setResult(null)}
            >
              Tekrar dene
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Başarılı yanıt
  return (
    <Card tone="accent" padding="lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <CardHeader>Bilgi Bankası — Univera Panorama</CardHeader>
          <CardTitle>Cevap</CardTitle>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
            <span>{(result.meta.totalLatencyMs / 1000).toFixed(1)}s</span>
            <span>·</span>
            <span>{result.citations.length} kaynak</span>
            {result.meta.verifierUsed && (
              <>
                <span>·</span>
                <CheckCircle2 size={10} className="text-good" />
                <span className="text-good">doğrulandı</span>
              </>
            )}
          </div>
        </div>
        <Database size={18} className="text-accent shrink-0 mt-0.5" />
      </div>

      <div className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
        {result.answer}
      </div>

      {result.citations.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSourcesOpen((x) => !x)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Kaynaklar ({result.citations.length})
          </button>
          {sourcesOpen && (
            <ul className="mt-2 space-y-3 border-t border-border pt-2">
              {result.citations.map((s) => (
                <li key={s.number} className="text-xs leading-relaxed">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="font-mono text-accent shrink-0 mt-0.5">
                      [{s.number}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-fg-1">
                          {s.title ?? s.heading_path ?? "(başlıksız)"}
                        </p>
                        <Badge tone={SOURCE_TONE[s.source_type]} size="sm">
                          {SOURCE_LABEL[s.source_type]}
                        </Badge>
                      </div>
                      {s.heading_path && s.heading_path !== s.title && (
                        <p className="text-muted text-[10px] mt-0.5">
                          {s.heading_path}
                        </p>
                      )}
                      <p className="text-fg-2 mt-1">{s.excerpt}…</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[11px] text-muted">
          {result.meta.modelUsed} · embed→{(result.meta.retrievalLatencyMs / 1000).toFixed(1)}s
          · gen→{(result.meta.generationLatencyMs / 1000).toFixed(1)}s
          {result.meta.verifierUsed &&
            ` · verifier→${(result.meta.verifierLatencyMs / 1000).toFixed(1)}s`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
          Yeni soru
        </Button>
      </div>

      {error && (
        <p className="text-xs text-bad mt-3">
          <strong>Hata:</strong> {error}
        </p>
      )}
    </Card>
  );
}
