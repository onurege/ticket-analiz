import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSyntheses } from "@/lib/ticket/synthesis-storage";

export const dynamic = "force-dynamic";

function encodeKey(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export default function KnownIssuesPage() {
  const items = listSyntheses();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bilinen Sorunlar</h1>
          <p className="text-sm text-muted mt-1">
            Cluster'lardan üretilmiş pattern sentezleri — ortak kök neden,
            varyantlar ve kanonik çözüm playbook'ları.
          </p>
        </div>
        <Badge tone="muted">{items.length} sentez</Badge>
      </div>

      {items.length === 0 && (
        <Card padding="lg" tone="muted">
          <CardHeader>Henüz yok</CardHeader>
          <CardTitle>Bilinen sorun listesi boş</CardTitle>
          <p className="text-sm text-fg-2 mt-2">
            <Link href="/support/clusters" className="text-accent underline">
              Hata Kümeleri
            </Link>{" "}
            sayfasından bir kümeye girip{" "}
            <strong>Sentez Üret</strong> diyerek yeni bir bilinen sorun
            oluşturabilirsin.
          </p>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((m) => (
          <li key={m.id}>
            <Link
              href={`/support/clusters/${m.groupBy}__${encodeKey(m.groupKey)}`}
              className="block hover:opacity-95"
            >
              <Card padding="md">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-semibold">{m.groupKey}</p>
                  <Badge tone="accent" size="md">
                    {m.totalInGroup} kayıt
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <Badge tone="muted" size="sm">
                    {m.groupBy}
                  </Badge>
                  <Badge tone="muted" size="sm">
                    örneklem: {m.sampledCount}
                  </Badge>
                  <Badge tone="muted" size="sm">
                    {m.modelUsed}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted">
                  Son güncelleme: {m.updatedAt.slice(0, 16).replace("T", " ")}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
