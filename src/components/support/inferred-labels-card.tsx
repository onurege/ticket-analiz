import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./severity-badge";

type Inferred = {
  bildirim_tipi: string;
  oncelik: string;
  katman: string;
  kok_neden: string;
  confidence: number;
};

export function InferredLabelsCard({ inferred }: { inferred: Inferred }) {
  const pct = Math.round(inferred.confidence * 100);
  return (
    <Card tone="accent" padding="lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <CardHeader>Tahmin Edilen Etiketler</CardHeader>
          <CardTitle>Sınıflandırma · %{pct} güven</CardTitle>
        </div>
        <SeverityBadge value={inferred.oncelik} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Item label="Tipi" value={inferred.bildirim_tipi} />
        <Item label="Katman" value={inferred.katman} />
        <Item label="Kök Neden" value={inferred.kok_neden} wide />
      </div>
    </Card>
  );
}

function Item({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <Badge tone="accent" size="md" className="mt-1">
        {value}
      </Badge>
    </div>
  );
}
