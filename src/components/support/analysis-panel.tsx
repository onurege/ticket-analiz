import { MatchedRecordCard } from "./matched-record-card";
import { InferredLabelsCard } from "./inferred-labels-card";
import { RootCauseList } from "./root-cause-list";
import { SuggestedSteps } from "./suggested-steps";
import { SimilarRecordsTable } from "./similar-records-table";
import { CustomerReplyCard } from "./customer-reply-card";
import { EngineeringHandoffCard } from "./engineering-handoff-card";
import { FeedbackBar } from "./feedback-bar";
import { PanoramaScreensCard } from "./panorama-screens-card";
import {
  NotebookLmCard,
  type NotebookLmAnswer,
} from "./notebooklm-card";
import { KnowledgeBaseCard, type TicketContext } from "./kb-card";
import { SourceGuidanceCards } from "./source-guidance-card";
import type { PanoramaScreen } from "@/lib/ticket/panorama-docs";

export type AnalyzeApiResult = {
  analysisId: string;
  matched: Record<string, unknown> | null;
  panoramaScreens?: PanoramaScreen[];
  notebookLm?: NotebookLmAnswer | null;
  input?: {
    bildirimNo: number | null;
    freeText: string | null;
    project: string | null;
  };
  similar: Array<{
    bildirim_no: number;
    score: number;
    proje: string | null;
    kategori_uzun: string | null;
    kok_neden: string | null;
    aciklama: string | null;
    cozum: string | null;
    bug_group: string | null;
    tfs_tip: string | null;
  }>;
  analysis: {
    inferred: {
      bildirim_tipi: string;
      oncelik: string;
      katman: string;
      kok_neden: string;
      confidence: number;
    } | null;
    rootCauseHypotheses: Array<{ text: string; confidence: number }>;
    suggestedSteps: Array<{ step: string; rationale?: string | null }>;
    customerReplyDraft: string;
    engineeringHandoff: string;
    suggestedBugGroup?: string | null;
    suggestedTfsTip?: string | null;
    n4bGuidance?: string | null;
    otherDocsGuidance?: string | null;
    meta: { modelUsed: string; latencyMs: number };
  };
};

function readMatchedField(
  matched: Record<string, unknown> | null,
  ...keys: string[]
): string | null {
  if (!matched) return null;
  for (const k of keys) {
    const v = matched[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function buildTicketContext(result: AnalyzeApiResult): TicketContext {
  const { matched, analysis, input } = result;
  const bildirimNoStr = readMatchedField(matched, "Bildirim_No", "bildirim_no");
  const bildirimNo = bildirimNoStr
    ? Number(bildirimNoStr)
    : (input?.bildirimNo ?? null);
  // matched öncelikli, yoksa analysis.inferred (LLM çıkarımı), yoksa input
  return {
    bildirimNo,
    proje: readMatchedField(matched, "PROJE", "proje") ?? input?.project ?? null,
    kategori:
      readMatchedField(matched, "Uzun_Kategori_Adi", "kategori_uzun") ?? null,
    kokNeden:
      readMatchedField(matched, "Konunun_Kok_Nedeni", "kok_neden") ??
      analysis.inferred?.kok_neden ??
      null,
    aciklama:
      readMatchedField(matched, "Bildirim_Aciklamasi", "aciklama") ??
      input?.freeText ??
      null,
    freeText: input?.freeText ?? null,
  };
}

export function AnalysisPanel({ result }: { result: AnalyzeApiResult }) {
  const { matched, similar, analysis, analysisId, panoramaScreens, notebookLm } =
    result;
  const ticketContext = buildTicketContext(result);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sol kolon — bağlam */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {matched && <MatchedRecordCard row={matched} />}
        {analysis.inferred && <InferredLabelsCard inferred={analysis.inferred} />}
        {panoramaScreens && panoramaScreens.length > 0 && (
          <PanoramaScreensCard
            screens={panoramaScreens}
            emptyMessage="Bu sorun için Panorama kılavuzunda eşleşme bulunamadı."
          />
        )}
        <SimilarRecordsTable items={similar} />
      </div>

      {/* Orta+sağ kolon — analiz çıktısı */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <RootCauseList items={analysis.rootCauseHypotheses} />
        <SourceGuidanceCards
          n4bGuidance={analysis.n4bGuidance ?? null}
          otherDocsGuidance={analysis.otherDocsGuidance ?? null}
        />
        <SuggestedSteps steps={analysis.suggestedSteps} />
        <KnowledgeBaseCard ticket={ticketContext} />
        {/* NotebookLmCard pasif — KB sistemine geçildi. Geri dönüş için kod
            durmaya devam ediyor; UI'dan göstermiyoruz. */}
        {false && (
          <NotebookLmCard ticket={ticketContext} initial={notebookLm ?? null} />
        )}
        <CustomerReplyCard draft={analysis.customerReplyDraft} />
        <EngineeringHandoffCard
          summary={analysis.engineeringHandoff}
          suggestedBugGroup={analysis.suggestedBugGroup ?? null}
          suggestedTfsTip={analysis.suggestedTfsTip ?? null}
        />
        <FeedbackBar analysisId={analysisId} />
        <p className="text-[11px] text-muted text-right">
          Model: {analysis.meta.modelUsed} · {analysis.meta.latencyMs}ms · id={" "}
          <span className="font-mono">{analysisId}</span>
        </p>
      </div>
    </div>
  );
}
