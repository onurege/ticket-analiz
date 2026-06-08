import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClusterCard } from "@/components/support/cluster-card";
import { listClusters, type GroupBy } from "@/lib/ticket/clusters";

export const dynamic = "force-dynamic";

type Search = Promise<{ groupBy?: string; days?: string; top?: string }>;

const TABS: Array<{ key: GroupBy; label: string }> = [
  { key: "kok_neden", label: "Kök Neden" },
  { key: "kategori_uzun", label: "Kategori" },
  { key: "bug_group", label: "Bug Group" },
  { key: "bildirim_tipi", label: "Tipi" },
];

function isGroupBy(v: string | undefined): v is GroupBy {
  return v === "kok_neden" || v === "kategori_uzun" || v === "bug_group" || v === "bildirim_tipi";
}

export default async function ClustersPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const groupBy: GroupBy = isGroupBy(sp.groupBy) ? sp.groupBy : "kok_neden";
  const lookbackDays = Number(sp.days) || 180;
  const top = Number(sp.top) || 24;

  let clusters: ReturnType<typeof listClusters> = [];
  let error: string | null = null;
  try {
    clusters = listClusters({ groupBy, lookbackDays, top });
  } catch (err) {
    error = (err as Error).message;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Hata Kümeleri</h1>
          <p className="text-sm text-muted mt-1">
            Son {lookbackDays} gün · {groupBy} bazında en sık tekrar eden gruplar.
          </p>
        </div>
        <Badge tone="muted">{clusters.length} küme</Badge>
      </div>

      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/support/clusters?groupBy=${t.key}&days=${lookbackDays}&top=${top}`}
            className={[
              "px-3 h-8 rounded-md text-xs font-medium transition-colors flex items-center",
              groupBy === t.key
                ? "bg-[var(--color-accent-soft)] text-accent"
                : "text-muted hover:text-fg hover:bg-surface-2",
            ].join(" ")}
          >
            {t.label}
          </a>
        ))}
      </div>

      {error && (
        <Card tone="bad" padding="lg">
          <p className="text-sm">Hata: {error}</p>
        </Card>
      )}

      {clusters.length === 0 && !error && (
        <Card padding="lg" tone="muted">
          <CardHeader>Veri yok</CardHeader>
          <CardTitle>Lokal snapshot boş</CardTitle>
          <p className="text-sm text-fg-2 mt-2">
            Önce <code className="font-mono text-xs">npx tsx scripts/sync-and-embed.ts</code>{" "}
            ile veri çekmelisin.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clusters.map((c, i) => (
          <ClusterCard key={`${c.key}-${i}`} cluster={c} groupBy={groupBy} />
        ))}
      </div>
    </div>
  );
}
