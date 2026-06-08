import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/*
 * Kaynak-ayrımlı KB rehberlik kartları.
 *
 * Amaç: kullanıcı analiz çıktısında "N4B operatör çözüm notları gerçekten
 * bu sorunun çözümüne katkı sağladı mı?" sorusunun yanıtını görebilsin.
 * İki ayrı kart:
 *   - N4B Operatör Çözüm Notları
 *   - Diğer Dökümanlar (Panorama kılavuzu, geçmiş ticket çözümleri, PDF)
 *
 * Analyst null döndürürse o kaynakta ilgili bilgi yok demektir → kart "Bu
 * kaynakta ilgili bilgi yok" şeklinde nötr görünür.
 */

export function SourceGuidanceCards({
  n4bGuidance,
  otherDocsGuidance,
}: {
  n4bGuidance?: string | null;
  otherDocsGuidance?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <SourceCard
        title="N4B Operatör Çözüm Notları"
        subtitle="TBL_N4B_COZUM_ACIKLAMALAR"
        tone="accent"
        guidance={n4bGuidance ?? null}
      />
      <SourceCard
        title="Diğer Dökümanlar"
        subtitle="Panorama Kılavuzu · Ticket Geçmişi · PDF"
        tone="default"
        guidance={otherDocsGuidance ?? null}
      />
    </div>
  );
}

function SourceCard({
  title,
  subtitle,
  guidance,
  tone,
}: {
  title: string;
  subtitle: string;
  guidance: string | null;
  tone: "accent" | "default";
}) {
  const empty = !guidance || !guidance.trim();
  return (
    <Card padding="md" tone={empty ? "muted" : tone}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <CardHeader>{title}</CardHeader>
          <p className="text-[11px] text-muted mt-0.5 font-mono">{subtitle}</p>
        </div>
        <Badge tone={empty ? "muted" : tone === "accent" ? "accent" : "default"} size="sm">
          {empty ? "Bilgi yok" : "Kullanıldı"}
        </Badge>
      </div>
      {empty ? (
        <p className="text-sm text-muted italic">
          Bu kaynakta soruyla ilgili kullanılabilir bilgi bulunamadı.
        </p>
      ) : (
        <CardTitle className="text-sm font-normal leading-relaxed whitespace-pre-line">
          {guidance}
        </CardTitle>
      )}
    </Card>
  );
}
