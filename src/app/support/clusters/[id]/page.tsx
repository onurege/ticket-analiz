import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SynthesizeButton } from "@/components/support/synthesize-button";
import type { SynthesisResult } from "@/components/support/synthesis-panel";
import { listClusters, type GroupBy } from "@/lib/ticket/clusters";
import { synthesisIdFor, loadSynthesis } from "@/lib/ticket/synthesis-storage";
import { getDb } from "@/lib/ticket/local-store";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const ALLOWED: ReadonlySet<GroupBy> = new Set([
  "kok_neden",
  "kategori_uzun",
  "bug_group",
  "bildirim_tipi",
]);

/**
 * URL'den (`<groupBy>__<base64url(key)>`) groupBy + key çöz. Tek tireyle ya
 * da özel karakterli key'ler için base64url kullanıyoruz, böylece slash veya
 * türkçe karakter kayıp olmaz.
 */
function decodeId(raw: string): { groupBy: GroupBy; key: string } | null {
  const sep = raw.indexOf("__");
  if (sep <= 0) return null;
  const groupBy = raw.slice(0, sep);
  const b64 = raw.slice(sep + 2);
  if (!ALLOWED.has(groupBy as GroupBy)) return null;
  try {
    const key = Buffer.from(b64, "base64url").toString("utf8");
    if (!key) return null;
    return { groupBy: groupBy as GroupBy, key };
  } catch {
    return null;
  }
}

function fetchGroupSamples(groupBy: GroupBy, key: string, limit = 12) {
  return getDb()
    .prepare(
      `SELECT bildirim_no, bildirim_tarihi, bildirim_tipi, oncelik, katman,
              proje, kategori_uzun, aciklama, cozum
       FROM tickets
       WHERE ${groupBy} = ?
       ORDER BY bildirim_tarihi DESC, bildirim_no DESC
       LIMIT ?`,
    )
    .all(key, limit) as Array<{
    bildirim_no: number;
    bildirim_tarihi: string | null;
    bildirim_tipi: string | null;
    oncelik: string | null;
    katman: string | null;
    proje: string | null;
    kategori_uzun: string | null;
    aciklama: string | null;
    cozum: string | null;
  }>;
}

export default async function ClusterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const decoded = decodeId(id);
  if (!decoded) notFound();

  // İstatistik bilgisi için aynı groupBy ile listClusters'tan ilgili cluster'ı çek
  const allClusters = listClusters({ groupBy: decoded.groupBy, lookbackDays: 365, top: 100 });
  const cluster = allClusters.find((c) => c.key === decoded.key);
  if (!cluster) notFound();

  const samples = fetchGroupSamples(decoded.groupBy, decoded.key);

  const synthId = synthesisIdFor(decoded.groupBy, decoded.key);
  // storage.synthesis tipi `unknown` çünkü dosyadan parse ediliyor; UI'a
  // verirken somut şemaya cast ediyoruz (Zod doğrulaması POST sırasında
  // synthesizer.ts içinde yapılmış olduğundan saklanan kayıt güvenli).
  const existing = loadSynthesis(synthId) as SynthesisResult | null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-wider">
          {decoded.groupBy}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{decoded.key}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="md">
          <CardHeader>Kayıt Sayısı</CardHeader>
          <CardTitle className="text-2xl">{cluster.count}</CardTitle>
        </Card>
        <Card padding="md">
          <CardHeader>İlk / Son Görülme</CardHeader>
          <CardTitle className="text-sm">
            {cluster.firstSeen?.slice(0, 10) ?? "—"} → {cluster.lastSeen?.slice(0, 10) ?? "—"}
          </CardTitle>
        </Card>
        <Card padding="md">
          <CardHeader>Severity Dağılımı</CardHeader>
          <div className="flex flex-wrap gap-1 mt-1">
            {cluster.severityMix.Kritik > 0 && (
              <Badge tone="bad" size="sm">
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
        </Card>
      </div>

      <SynthesizeButton
        groupBy={decoded.groupBy}
        groupKey={decoded.key}
        initialResult={existing}
      />

      <Card padding="lg">
        <CardHeader>Son Örnekler</CardHeader>
        <CardTitle className="mb-3">{samples.length} kayıt</CardTitle>
        <ul className="flex flex-col divide-y divide-border -mx-1">
          {samples.map((s) => (
            <li key={s.bildirim_no} className="px-1 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm">#{s.bildirim_no}</span>
                <span className="text-[11px] text-muted">{s.bildirim_tarihi?.slice(0, 10)}</span>
                <Badge tone="muted" size="sm">
                  {s.bildirim_tipi ?? "—"}
                </Badge>
                <Badge tone="muted" size="sm">
                  {s.katman ?? "—"}
                </Badge>
                {s.proje && (
                  <Badge tone="default" size="sm">
                    {s.proje}
                  </Badge>
                )}
              </div>
              {s.aciklama && (
                <p className="text-xs text-fg-2 leading-relaxed line-clamp-2 mt-1">
                  <span className="text-muted uppercase tracking-wider text-[10px] mr-1">
                    Açıklama:
                  </span>
                  {s.aciklama}
                </p>
              )}
              {s.cozum && (
                <p className="text-xs text-fg-2 leading-relaxed line-clamp-2 mt-1">
                  <span className="text-muted uppercase tracking-wider text-[10px] mr-1">
                    Çözüm:
                  </span>
                  {s.cozum}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
