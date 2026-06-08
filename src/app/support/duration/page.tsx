import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getOzetDb,
  kpis,
  kokNedenStats,
  crossMatrix,
  slaDistribution,
  monthlyTrend,
  getFilterOptions,
  getMeta,
  type OzetFilters,
} from "@/lib/ticket/ozet-store";

export const dynamic = "force-dynamic";

type Search = Promise<{
  yil?: string;
  ay?: string;
  oncelik?: string;
  support?: string;
  kok?: string;
}>;

const AY_ADI = [
  "", "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

// Sure kolonu gün cinsinden geliyor; tüm görüntüleme saate çevriliyor.
function fmtHours(d: number): string {
  if (d == null || Number.isNaN(d)) return "-";
  const h = d * 24;
  if (h < 1) return `${Math.round(h * 60)} dk`;
  if (h < 10) return `${h.toFixed(1)} sa`;
  return `${h.toFixed(0)} sa`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("tr-TR");
}

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function buildQuery(current: Record<string, string | undefined>, patch: Record<string, string | null>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (v != null && v !== "") merged[k] = v;
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") delete merged[k];
    else merged[k] = v;
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `?${qs}` : "";
}

export default async function DurationDashboard({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;

  // Snapshot yoksa erken çık
  try {
    getOzetDb();
  } catch {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold tracking-tight">Çözüm Süreleri Paneli</h1>
        <Card padding="lg" tone="warn">
          <CardHeader>Snapshot bulunamadı</CardHeader>
          <p className="text-sm text-fg-2 mt-2">
            Önce snapshot oluştur:{" "}
            <code className="font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">
              node scripts/sync-ozet.mjs
            </code>
          </p>
        </Card>
      </div>
    );
  }

  const filters: OzetFilters = {
    yil: sp.yil ? Number(sp.yil) : null,
    ay: sp.ay ? Number(sp.ay) : null,
    oncelik: sp.oncelik || null,
    support: sp.support || null,
    kokNeden: sp.kok || null,
  };

  const opts = getFilterOptions();
  const meta = getMeta();
  const k = kpis(filters);
  const kn = kokNedenStats(filters);
  const sla = slaDistribution(filters);
  const trend = monthlyTrend({ ...filters, ay: null });
  const matrix = crossMatrix(filters, { topKokNedenLimit: 10, topKategoriLimit: 12 });

  const activeFilters: Array<[string, string]> = [];
  if (sp.yil) activeFilters.push(["Yıl", sp.yil]);
  if (sp.ay) activeFilters.push(["Ay", AY_ADI[Number(sp.ay)] ?? sp.ay]);
  if (sp.oncelik) activeFilters.push(["Öncelik", sp.oncelik]);
  if (sp.support) activeFilters.push(["Destek", sp.support]);
  if (sp.kok) activeFilters.push(["Kök Neden", sp.kok]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Çözüm Süreleri Paneli
          </h1>
          <p className="text-sm text-muted mt-1">
            Kök nedenlerin hangi kategori ile çözüldüğü ve kapanış süreleri.
            Veri: <code className="font-mono text-[11px]">Ticket_Kayıtları_Ozet</code>.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Badge tone="muted">{fmtNum(meta.rowCount)} kayıt</Badge>
            {meta.syncedAt && (
              <Badge tone="muted">
                Senk: {new Date(meta.syncedAt).toLocaleDateString("tr-TR")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card padding="md">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <FilterSelect
            name="yil"
            label="Yıl"
            value={sp.yil ?? ""}
            options={opts.yillar.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <FilterSelect
            name="ay"
            label="Ay"
            value={sp.ay ?? ""}
            options={opts.aylar.map((a) => ({ value: String(a), label: AY_ADI[a] ?? String(a) }))}
          />
          <FilterSelect
            name="oncelik"
            label="Öncelik"
            value={sp.oncelik ?? ""}
            options={opts.oncelikler.map((o) => ({ value: o, label: o }))}
          />
          <FilterSelect
            name="support"
            label="Destek Katmanı"
            value={sp.support ?? ""}
            options={opts.supports.map((s) => ({ value: s, label: s }))}
          />
          <FilterSelect
            name="kok"
            label="Kök Neden"
            value={sp.kok ?? ""}
            options={opts.kokNedenler.map((k2) => ({ value: k2, label: k2 }))}
          />
          <button
            type="submit"
            className="h-9 px-4 bg-accent text-accent-fg rounded-md text-sm font-medium"
          >
            Uygula
          </button>
          {activeFilters.length > 0 && (
            <Link
              href="/support/duration"
              className="h-9 px-3 flex items-center text-sm text-muted hover:text-fg"
            >
              Temizle
            </Link>
          )}
        </form>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {activeFilters.map(([k2, v]) => (
              <Badge key={k2} tone="accent" size="sm">
                {k2}: {v}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Toplam Ticket" value={fmtNum(k.total)} />
        <KpiCard label="Ortalama Süre" value={fmtHours(k.avgSure)} />
        <KpiCard label="Medyan Süre" value={fmtHours(k.medianSure)} />
        <KpiCard label="P90 Süre" value={fmtHours(k.p90Sure)} hint="%90'ı bu süre içinde kapanmış" />
        <KpiCard
          label="< 24 saat Kapanan"
          value={fmtNum(k.closedSameDay)}
          hint={`${pct(k.closedSameDay, k.total)} oranı`}
          tone="good"
        />
        <KpiCard
          label="168+ saat Süren"
          value={fmtNum(k.over7DayCount)}
          hint={`${pct(k.over7DayCount, k.total)} oranı`}
          tone="warn"
        />
        <KpiCard
          label="Acil Bildirim"
          value={fmtNum(k.acilCount)}
          hint={`${pct(k.acilCount, k.total)} oranı`}
          tone="bad"
        />
        <KpiCard
          label="TFS Açılan"
          value={fmtNum(k.tfsCount)}
          hint={`${pct(k.tfsCount, k.total)} oranı`}
        />
      </div>

      {/* SLA + Aylık trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card padding="md">
          <CardHeader>SLA Dağılımı</CardHeader>
          <CardTitle className="mb-3">Kapanış süresi bandları</CardTitle>
          <div className="flex flex-col gap-2">
            {sla.map((b) => {
              const w = k.total ? (b.count / k.total) * 100 : 0;
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-fg-2 shrink-0">{b.label}</div>
                  <div className="flex-1 h-5 bg-surface-2 rounded relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent/60"
                      style={{ width: `${w}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[11px] font-medium">
                        {fmtNum(b.count)} ({w.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>Aylık Dağılım</CardHeader>
          <CardTitle className="mb-3">Ticket sayısı ve ortalama süre</CardTitle>
          <div className="flex flex-col gap-2">
            {trend.map((t) => {
              const maxCount = Math.max(...trend.map((x) => x.count));
              const w = maxCount ? (t.count / maxCount) * 100 : 0;
              return (
                <div key={`${t.yil}-${t.ay}`} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-fg-2 shrink-0">
                    {AY_ADI[t.ay]} {t.yil}
                  </div>
                  <div className="flex-1 h-5 bg-surface-2 rounded relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent/40"
                      style={{ width: `${w}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 justify-between">
                      <span className="text-[11px] font-medium">{fmtNum(t.count)}</span>
                      <span className="text-[11px] text-muted">
                        ort {fmtHours(t.avgSure)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {trend.length === 0 && (
              <p className="text-xs text-muted">Veri yok.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Kök neden tablosu */}
      <Card padding="md">
        <div className="flex items-end justify-between mb-3">
          <div>
            <CardHeader>Kök Neden × Süre</CardHeader>
            <CardTitle className="mt-1">
              {kn.length} kök neden, en çok eşleşen kategori ile birlikte
            </CardTitle>
          </div>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="text-left py-2 px-2">Kök Neden</th>
                <th className="text-right py-2 px-2">Ticket</th>
                <th className="text-right py-2 px-2">Ort. Süre</th>
                <th className="text-right py-2 px-2">Medyan</th>
                <th className="text-right py-2 px-2">P90</th>
                <th className="text-right py-2 px-2">Acil</th>
                <th className="text-right py-2 px-2">TFS</th>
                <th className="text-left py-2 px-2">En Çok Eşleşen Kategori</th>
              </tr>
            </thead>
            <tbody>
              {kn.map((row) => {
                const active = sp.kok === row.kokNeden;
                const qs = buildQuery(sp, { kok: active ? null : row.kokNeden });
                return (
                  <tr
                    key={row.kokNeden}
                    className={`border-b border-border/50 hover:bg-surface-2 ${active ? "bg-[var(--color-accent-soft)]" : ""}`}
                  >
                    <td className="py-2 px-2">
                      <Link
                        href={`/support/duration${qs}`}
                        className="text-sm font-medium hover:text-accent"
                      >
                        {row.kokNeden}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtNum(row.count)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtHours(row.avgSure)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtHours(row.medianSure)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtHours(row.p90Sure)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtNum(row.acilCount)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-xs">
                      {fmtNum(row.tfsCount)}
                    </td>
                    <td className="py-2 px-2 text-xs text-fg-2 max-w-[280px] truncate">
                      {row.topKategori}
                      <span className="text-muted ml-1">
                        ({fmtNum(row.topKategoriCount)})
                      </span>
                    </td>
                  </tr>
                );
              })}
              {kn.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-muted">
                    Veri yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cross matrix */}
      <Card padding="md">
        <CardHeader>Kök Neden × Kategori Matrisi</CardHeader>
        <CardTitle className="mb-3">
          Hangi kategori altında çözülmüş — ortalama süre rengi
        </CardTitle>
        <div className="overflow-x-auto -mx-1">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 sticky left-0 bg-surface border-b border-border min-w-[200px]">
                  Kök Neden \ Kategori
                </th>
                {matrix.kategoriler.map((kat) => (
                  <th
                    key={kat}
                    className="py-2 px-2 border-b border-border text-[10px] font-medium text-fg-2 align-bottom whitespace-nowrap"
                  >
                    <div className="rotate-180" style={{ writingMode: "vertical-rl" }}>
                      {kat}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.kokNedenler.map((kn2) => (
                <tr key={kn2} className="border-b border-border/40">
                  <td className="py-2 px-2 sticky left-0 bg-surface font-medium text-xs">
                    {kn2}
                  </td>
                  {matrix.kategoriler.map((kat) => {
                    const cell = matrix.cells.find(
                      (c) => c.kokNeden === kn2 && c.kategori === kat,
                    );
                    if (!cell) {
                      return (
                        <td key={kat} className="text-center text-muted/40">
                          ·
                        </td>
                      );
                    }
                    const tone = cellTone(cell.avgSure);
                    return (
                      <td key={kat} className="text-center p-0">
                        <div
                          className={`mx-auto py-1.5 px-2 ${tone} rounded-sm`}
                          title={`${cell.count} ticket · ort ${fmtHours(cell.avgSure)}`}
                        >
                          <div className="font-mono font-semibold leading-tight">
                            {fmtNum(cell.count)}
                          </div>
                          <div className="text-[9px] text-muted leading-tight">
                            {fmtHours(cell.avgSure)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted mt-3">
          Hücrede üst sayı = ticket adedi, alt sayı = ortalama kapanış süresi.
          Renkler süre bandını gösterir: yeşil &lt; 24 sa, sarı 24–72 sa, kırmızı &gt; 72 sa.
        </p>
      </Card>
    </div>
  );
}

function cellTone(sure: number): string {
  if (sure < 1) return "bg-[var(--color-good-soft)] text-good";
  if (sure < 3) return "bg-[var(--color-warn-soft)] text-warn";
  return "bg-[var(--color-bad-soft)] text-bad";
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  return (
    <Card padding="md" tone={tone === "default" ? "default" : tone}>
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-fg-2 mt-1">{hint}</div>}
    </Card>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-9 text-sm bg-surface border border-border-strong rounded-md px-2 min-w-[120px]"
      >
        <option value="">Tümü</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
