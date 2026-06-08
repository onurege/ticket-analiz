import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PanoramaScreensCard } from "@/components/support/panorama-screens-card";
import {
  listMembersOfCategory,
  listTopicsFromBundle,
  loadBundle,
} from "@/lib/ticket/recategorizer";
import { getScreensForCategory } from "@/lib/ticket/panorama-docs";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function TopicDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const bundle = loadBundle();
  if (!bundle) notFound();

  const topics = listTopicsFromBundle(bundle);
  const topic = topics.find((t) => t.category.id === id);
  if (!topic) notFound();

  const members = listMembersOfCategory(bundle, id, 100);
  const panoramaScreens = getScreensForCategory(id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          {topic.count} ticket · id: <span className="font-mono">{topic.category.id}</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {topic.category.title}
        </h1>
        <p className="text-sm text-fg-2 mt-2 leading-relaxed">
          {topic.category.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader>Severity Dağılımı</CardHeader>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {topic.severityMix.Kritik > 0 && (
              <Badge tone="bad" size="md" dot>
                {topic.severityMix.Kritik} Kritik
              </Badge>
            )}
            {topic.severityMix.Yüksek > 0 && (
              <Badge tone="warn" size="md">
                {topic.severityMix.Yüksek} Yüksek
              </Badge>
            )}
            {topic.severityMix.Normal > 0 && (
              <Badge tone="good" size="md">
                {topic.severityMix.Normal} Normal
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted mt-2">
            {topic.firstSeen?.slice(0, 10) ?? "—"} → {topic.lastSeen?.slice(0, 10) ?? "—"}
          </p>
        </Card>
        <Card padding="md">
          <CardHeader>Atama Güveni</CardHeader>
          <p className="text-sm text-fg-2 mt-1">
            Ortalama:{" "}
            <span className="font-mono">
              %
              {members.length > 0
                ? Math.round(
                    (members.reduce((s, m) => s + m.confidence, 0) /
                      members.length) *
                      100,
                  )
                : 0}
            </span>{" "}
            · medyan{" "}
            <span className="font-mono">
              %
              {members.length > 0
                ? Math.round(
                    members
                      .slice()
                      .sort((a, b) => a.confidence - b.confidence)[
                      Math.floor(members.length / 2)
                    ]!.confidence * 100,
                  )
                : 0}
            </span>
          </p>
        </Card>
      </div>

      <PanoramaScreensCard screens={panoramaScreens} />

      <Card padding="lg">
        <CardHeader>Bu Kategorideki Ticket'lar</CardHeader>
        <CardTitle className="mb-3">{members.length} kayıt gösteriliyor</CardTitle>
        <ul className="flex flex-col divide-y divide-border -mx-1">
          {members.map((m) => (
            <li key={m.bildirim_no} className="px-1 py-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm">#{m.bildirim_no}</span>
                <span className="text-[11px] text-muted">
                  {m.bildirim_tarihi?.slice(0, 10) ?? "—"}
                </span>
                {m.oncelik && (
                  <Badge
                    tone={
                      m.oncelik === "Kritik"
                        ? "bad"
                        : m.oncelik === "Yüksek"
                          ? "warn"
                          : "muted"
                    }
                    size="sm"
                  >
                    {m.oncelik}
                  </Badge>
                )}
                {m.proje && (
                  <Badge tone="default" size="sm">
                    {m.proje}
                  </Badge>
                )}
                <Badge tone="muted" size="sm">
                  güven %{Math.round(m.confidence * 100)}
                </Badge>
              </div>
              {m.aciklama && (
                <p className="text-xs text-fg-2 leading-relaxed line-clamp-3">
                  {m.aciklama}
                </p>
              )}
              {m.kategori_uzun && (
                <p className="text-[10px] text-muted mt-1 italic">
                  Orijinal kategori (bilgi): {m.kategori_uzun}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
