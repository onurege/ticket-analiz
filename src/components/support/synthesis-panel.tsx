import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type SynthesisResult = {
  meta: {
    id: string;
    groupBy: string;
    groupKey: string;
    totalInGroup: number;
    sampledCount: number;
    ticketIds: number[];
    modelUsed: string;
    latencyMs: number;
    createdAt: string;
    updatedAt: string;
  };
  synthesis: {
    pattern: {
      title: string;
      description: string;
      characteristicPhrases: string[];
    };
    commonRootCause: string;
    variants: Array<{
      title: string;
      description: string;
      rootCause: string;
      indicativeBildirimNos: number[];
    }>;
    canonicalSolution: Array<{
      step: string;
      appliesTo: string;
      evidence?: string | null;
    }>;
    edgeCases: Array<{ situation: string; handling: string }>;
    preventiveSuggestions: string[];
    coverageNote: string;
  };
};

export function SynthesisPanel({ result }: { result: SynthesisResult }) {
  const { meta, synthesis } = result;
  return (
    <div className="flex flex-col gap-4">
      <Card padding="lg" tone="accent">
        <CardHeader>Bilgi Bankası Özeti</CardHeader>
        <CardTitle className="mb-2">{synthesis.pattern.title}</CardTitle>
        <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
          {synthesis.pattern.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge tone="accent" size="md">
            {meta.sampledCount}/{meta.totalInGroup} kayıt
          </Badge>
          <Badge tone="muted" size="md">
            kaynak: {meta.modelUsed} · {meta.latencyMs}ms
          </Badge>
        </div>
      </Card>

      {synthesis.pattern.characteristicPhrases.length > 0 && (
        <Card padding="lg">
          <CardHeader>Müşterilerin Karakteristik İfadeleri</CardHeader>
          <CardTitle className="mb-3">
            {synthesis.pattern.characteristicPhrases.length} ifade
          </CardTitle>
          <ul className="flex flex-wrap gap-1.5">
            {synthesis.pattern.characteristicPhrases.map((p, i) => (
              <li
                key={i}
                className="text-xs italic text-fg-2 bg-surface-2 border border-border px-2 py-1 rounded"
              >
                “{p}”
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="lg" tone="warn">
        <CardHeader>Ortak Kök Neden</CardHeader>
        <p className="text-sm text-fg leading-relaxed mt-1">{synthesis.commonRootCause}</p>
      </Card>

      {synthesis.variants.length > 0 && (
        <Card padding="lg">
          <CardHeader>Alt Varyantlar</CardHeader>
          <CardTitle className="mb-3">{synthesis.variants.length} varyant</CardTitle>
          <ul className="flex flex-col gap-3">
            {synthesis.variants.map((v, i) => (
              <li key={i} className="border-l-2 border-accent/40 pl-3">
                <p className="text-sm font-semibold">{v.title}</p>
                <p className="text-xs text-fg-2 mt-1 leading-relaxed">{v.description}</p>
                <p className="text-[11px] text-muted mt-1">
                  <span className="uppercase tracking-wider mr-1">Kök:</span>
                  {v.rootCause}
                </p>
                {v.indicativeBildirimNos.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.indicativeBildirimNos.map((id) => (
                      <span
                        key={id}
                        className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.5 rounded"
                      >
                        #{id}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="lg" tone="good">
        <CardHeader>Kanonik Çözüm</CardHeader>
        <CardTitle className="mb-3">
          {synthesis.canonicalSolution.length} adım (geçmiş çözüm açıklamalarından)
        </CardTitle>
        <ol className="flex flex-col gap-3">
          {synthesis.canonicalSolution.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="size-6 rounded-full bg-good text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-fg leading-relaxed">{s.step}</p>
                  {s.appliesTo && s.appliesTo !== "all" && (
                    <Badge tone="muted" size="sm">
                      {s.appliesTo}
                    </Badge>
                  )}
                </div>
                {s.evidence && (
                  <p className="text-[11px] italic text-muted mt-1 leading-relaxed">
                    Kaynak: {s.evidence}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {synthesis.edgeCases.length > 0 && (
        <Card padding="lg">
          <CardHeader>Edge Case'ler</CardHeader>
          <CardTitle className="mb-3">{synthesis.edgeCases.length} özel durum</CardTitle>
          <ul className="flex flex-col gap-2">
            {synthesis.edgeCases.map((e, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-fg">{e.situation}</p>
                <p className="text-fg-2 leading-relaxed mt-0.5">{e.handling}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {synthesis.preventiveSuggestions.length > 0 && (
        <Card padding="lg" tone="muted">
          <CardHeader>Önleyici Öneriler</CardHeader>
          <ul className="flex flex-col gap-1.5 mt-2 list-disc list-inside text-sm text-fg-2">
            {synthesis.preventiveSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      )}

      {synthesis.coverageNote && (
        <p className="text-[11px] text-muted text-right">
          Kapsam notu: {synthesis.coverageNote}
        </p>
      )}
    </div>
  );
}
