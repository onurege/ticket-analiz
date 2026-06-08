import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Item = {
  bildirim_no: number;
  score: number;
  proje: string | null;
  kategori_uzun: string | null;
  kok_neden: string | null;
  aciklama: string | null;
  cozum: string | null;
  bug_group: string | null;
  tfs_tip: string | null;
};

export function SimilarRecordsTable({ items }: { items: Item[] }) {
  return (
    <Card padding="lg">
      <CardHeader>Benzer Geçmiş Kayıtlar</CardHeader>
      <CardTitle className="mb-3">{items.length} kayıt</CardTitle>
      {items.length === 0 ? (
        <p className="text-xs text-muted">
          Benzer kayıt bulunamadı. Embedding cache boş olabilir veya bu sorgu
          için yeterince yakın eşleşme yok.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border -mx-1">
          {items.map((s) => (
            <li key={s.bildirim_no} className="px-1 py-3">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">#{s.bildirim_no}</span>
                  <Badge tone="muted" size="sm">
                    %{Math.round(s.score * 100)}
                  </Badge>
                  {s.proje && (
                    <Badge tone="default" size="sm">
                      {s.proje}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {s.bug_group && (
                    <Badge tone="warn" size="sm">
                      {s.bug_group}
                    </Badge>
                  )}
                  {s.tfs_tip && (
                    <Badge tone="accent" size="sm">
                      TFS: {s.tfs_tip}
                    </Badge>
                  )}
                </div>
              </div>
              {s.kategori_uzun && (
                <p className="text-[11px] text-muted mb-1">{s.kategori_uzun}</p>
              )}
              {s.kok_neden && (
                <p className="text-xs text-fg-2 mb-1">
                  <span className="text-muted uppercase tracking-wider text-[10px] mr-1">
                    Kök:
                  </span>
                  {s.kok_neden}
                </p>
              )}
              {s.cozum && (
                <p className="text-xs text-fg-2 leading-relaxed line-clamp-3">
                  <span className="text-muted uppercase tracking-wider text-[10px] mr-1">
                    Çözüm:
                  </span>
                  {s.cozum}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
