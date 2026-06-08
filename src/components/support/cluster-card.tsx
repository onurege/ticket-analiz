import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Cluster } from "@/lib/ticket/clusters";

function encodeKey(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export function ClusterCard({
  cluster,
  groupBy,
}: {
  cluster: Cluster;
  groupBy: string;
}) {
  const href = `/support/clusters/${groupBy}__${encodeKey(cluster.key)}`;
  const total =
    cluster.severityMix.Normal +
    cluster.severityMix.Yüksek +
    cluster.severityMix.Kritik +
    cluster.severityMix.other;
  const kritikPct =
    total > 0 ? Math.round((cluster.severityMix.Kritik / total) * 100) : 0;
  const yuksekPct =
    total > 0 ? Math.round((cluster.severityMix.Yüksek / total) * 100) : 0;

  const tone =
    kritikPct > 10 ? "bad" : yuksekPct > 30 ? "warn" : "default";

  return (
    <Link href={href} className="block hover:opacity-95 transition-opacity">
      <Card padding="md" tone={tone}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold leading-snug">{cluster.key}</p>
          <Badge tone={tone === "default" ? "muted" : tone} size="md">
            {cluster.count}
          </Badge>
        </div>
        <div className="flex gap-1 mb-2 flex-wrap">
          {cluster.severityMix.Kritik > 0 && (
            <Badge tone="bad" size="sm" dot>
              {cluster.severityMix.Kritik} Kritik
            </Badge>
          )}
          {cluster.severityMix.Yüksek > 0 && (
            <Badge tone="warn" size="sm">
              {cluster.severityMix.Yüksek} Yüksek
            </Badge>
          )}
          {cluster.severityMix.Normal > 0 && (
            <Badge tone="good" size="sm">
              {cluster.severityMix.Normal} Normal
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted mb-2">
          {cluster.firstSeen?.slice(0, 10) ?? "—"} → {cluster.lastSeen?.slice(0, 10) ?? "—"}
        </p>
        <div className="flex gap-1 flex-wrap">
          {cluster.sampleIds.map((id) => (
            <span
              key={id}
              className="text-[10px] font-mono text-muted px-1.5 py-0.5 bg-surface-2 rounded"
            >
              #{id}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}
