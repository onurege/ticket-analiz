import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopicView } from "@/lib/ticket/recategorizer";

export function TopicCard({ topic, rank }: { topic: TopicView; rank: number }) {
  const total =
    topic.severityMix.Normal +
    topic.severityMix.Yüksek +
    topic.severityMix.Kritik +
    topic.severityMix.other;
  const kritikPct = total > 0 ? topic.severityMix.Kritik / total : 0;
  const yuksekPct = total > 0 ? topic.severityMix.Yüksek / total : 0;
  const tone = kritikPct > 0.1 ? "bad" : yuksekPct > 0.3 ? "warn" : "default";

  return (
    <Link
      href={`/support/topics/${topic.category.id}`}
      className="block hover:opacity-95 transition-opacity"
    >
      <Card padding="md" tone={tone}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl font-mono text-muted shrink-0 leading-none mt-0.5">
              {String(rank + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-semibold leading-snug">
                {topic.category.title}
              </p>
              <p className="text-[11px] text-muted leading-snug mt-1 line-clamp-2">
                {topic.category.description}
              </p>
            </div>
          </div>
          <Badge tone={tone === "default" ? "muted" : tone} size="md">
            {topic.count}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {topic.severityMix.Kritik > 0 && (
            <Badge tone="bad" size="sm" dot>
              {topic.severityMix.Kritik} Kritik
            </Badge>
          )}
          {topic.severityMix.Yüksek > 0 && (
            <Badge tone="warn" size="sm">
              {topic.severityMix.Yüksek} Yüksek
            </Badge>
          )}
          {topic.severityMix.Normal > 0 && (
            <Badge tone="good" size="sm">
              {topic.severityMix.Normal} Normal
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted">
            {topic.firstSeen?.slice(0, 10) ?? "—"} → {topic.lastSeen?.slice(0, 10) ?? "—"}
          </p>
          {topic.mappedGuides > 0 ? (
            <Badge tone="accent" size="sm">
              📖 {topic.mappedGuides} kılavuz
            </Badge>
          ) : (
            <Badge tone="muted" size="sm">
              📖 kılavuz yok
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
