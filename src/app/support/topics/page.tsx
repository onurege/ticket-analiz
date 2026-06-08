import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopicCard } from "@/components/support/topic-card";
import { ExportTopicsButton } from "@/components/support/export-topics-button";
import { listTopicsFromBundle, loadBundle } from "@/lib/ticket/recategorizer";

export const dynamic = "force-dynamic";

export default function TopicsPage() {
  const bundle = loadBundle();
  const topics = bundle ? listTopicsFromBundle(bundle) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Konular</h1>
          <p className="text-sm text-muted mt-1">
            Tüm bildirimler açıklama metni okunarak (orijinal kategoriler yok
            sayılarak) anlamlı iş kategorilerine yeniden atandı. En kalabalık
            konudan en seyreğe doğru sıralanmıştır.
          </p>
        </div>
        {bundle && (
          <div className="flex gap-2 items-center">
            <Badge tone="muted">{topics.length} kategori</Badge>
            <Badge tone="muted">{bundle.meta.ticketCount} ticket</Badge>
            <ExportTopicsButton />
          </div>
        )}
      </div>

      {!bundle && (
        <Card padding="lg" tone="muted">
          <CardHeader>Veri yok</CardHeader>
          <CardTitle>Sınıflandırma dosyası bulunamadı</CardTitle>
          <p className="text-sm text-fg-2 mt-2">
            <code className="font-mono text-xs">data/topics-v2/</code> altında{" "}
            <code className="font-mono text-xs">taxonomy.json</code>,{" "}
            <code className="font-mono text-xs">assignments.json</code> ve{" "}
            <code className="font-mono text-xs">meta.json</code> bulunmalı.
          </p>
        </Card>
      )}

      {bundle && (
        <>
          <p className="text-[11px] text-muted">
            Son sınıflandırma:{" "}
            <span className="font-mono">
              {bundle.meta.generatedAt.replace("T", " ").slice(0, 19)}
            </span>{" "}
            · kaynak: {bundle.meta.model}
          </p>
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topics.map((t, i) => (
              <li key={t.category.id} className="list-none">
                <TopicCard topic={t} rank={i} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
