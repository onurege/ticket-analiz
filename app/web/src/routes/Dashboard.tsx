import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { api } from "../lib/api";
import { HorizontalBar, TrendLine, ParetoChart } from "../components/Charts";

export default function Dashboard({ version = "v2" }: { version?: "v1" | "v2" }) {
  const [, setLocation] = useLocation();
  const stats = useQuery({
    queryKey: ["stats", version],
    queryFn: version === "v1" ? api.statsV1 : api.stats,
    refetchInterval: 60_000,
  });

  const goFilter = (key: string, value: string) => {
    setLocation(`/tickets?${key}=${encodeURIComponent(value)}`);
  };

  const isV2 = version === "v2";

  if (stats.isLoading) {
    return <div className="wrap"><p>Yükleniyor…</p></div>;
  }
  if (stats.error || !stats.data) {
    return <div className="wrap"><p style={{ color: "var(--p1)" }}>Veri alınamadı: {(stats.error as Error)?.message}</p></div>;
  }

  const d = stats.data;
  const t = d.totals;

  return (
    <div className="wrap">
      <div className="version-badge-wrap">
        <h1 className="page-title">Çağrı Merkezi Yönetim Dashboard'u</h1>
        <span className={`version-badge ${isV2 ? "v2" : "v1"}`}>
          {isV2 ? "v2 · Yeni Taxonomy (Akış Diyagramı)" : "v1 · Eski Taxonomy"}
        </span>
      </div>
      <p className="page-sub">
        Toplam <strong>{t.ticket}</strong> ticket {d.dateRange.from && <>· <strong>{d.dateRange.from}</strong> → <strong>{d.dateRange.to}</strong></>}
      </p>

      <div className="volume-grid">
        <Metric label="Toplam" value={t.ticket} detail={`${Object.keys(d.daily).length} aktif gün`} />
        <Metric label="İş Durduran" value={t.kritikDurduran} detail={`%${pct(t.kritikDurduran, t.ticket)} kritik`} variant="danger" />
        <Metric label="Eğitim Açığı" value={t.egitimKaynakli} detail={`%${pct(t.egitimKaynakli, t.ticket)} eğitim`} variant="warn" />
        <Metric label="E-Belge" value={`%${t.ebelgeYuzde}`} detail="En büyük süreç" variant="info" />
        {isV2 && (
          <Metric label="Self-Servis Pot." value={`%${t.selfServisYuzde ?? 0}`} detail="Kullanıcı kendi yapabilir" variant="success" />
        )}
        <Metric label="Operatör" value={t.operator} detail="Aktif ekip" />
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Hacim & Trend</h2>
          <span className="meta">Günlük</span>
        </div>
        <div className="card tall">
          <div className="card-head"><h3>Günlük Açılan Ticket</h3><span className="total">{t.ticket} toplam</span></div>
          <TrendLine data={d.daily} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Etiketler</h2>
          <span className="meta">Açılış sınıflandırması</span>
        </div>
        <div className="grid grid-2">
          <ChartCard title={isV2 ? "Kategori (İş Süreci)" : "İş Süreci"} count={Object.keys(d.isSureci).length} hint="tıkla → filtrele">
            <HorizontalBar data={d.isSureci} onBarClick={(v) => goFilter("is_sureci", v)} />
          </ChartCard>
          <ChartCard title="Etkilenen Nesne" count={`Top 10`} hint="tıkla → filtrele">
            <HorizontalBar
              data={Object.fromEntries(Object.entries(d.etkilenenNesne).slice(0, 10))}
              onBarClick={(v) => goFilter("etkilenen_nesne", v)}
            />
          </ChartCard>
          <ChartCard title={isV2 ? "Müşteri Problem Tipi (Eylem)" : "İşlem Tipi"} count={Object.keys(d.islemTipi).length} hint="tıkla → filtrele">
            <HorizontalBar data={d.islemTipi} onBarClick={(v) => goFilter("islem_tipi", v)} />
          </ChartCard>
          {isV2 && d.platform && Object.keys(d.platform).length > 0 && (
            <ChartCard title="Platform" count={Object.keys(d.platform).length} hint="tıkla → filtrele">
              <HorizontalBar data={d.platform} onBarClick={(v) => goFilter("platform", v)} />
            </ChartCard>
          )}
          <ChartCard title="Çözüm Tipi" count={Object.keys(d.cozumTipi).length} hint="tıkla → filtrele">
            <HorizontalBar data={d.cozumTipi} onBarClick={(v) => goFilter("cozum_tipi", v)} />
          </ChartCard>
          {isV2 && d.selfServis && Object.keys(d.selfServis).length > 0 && (
            <ChartCard title="Self-Servis Potansiyeli" count={Object.keys(d.selfServis).length} hint="tıkla → filtrele">
              <HorizontalBar data={d.selfServis} onBarClick={(v) => goFilter("self_servis", v)} />
            </ChartCard>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Kök Neden Analizi</h2>
          <span className="meta">ITIL Pareto · tıkla → filtrele</span>
        </div>
        <ChartCard title="Kök Neden Grupları" count={Object.keys(d.kokNedenGrup).length} hint="tıkla → filtrele">
          <HorizontalBar data={d.kokNedenGrup} onBarClick={(v) => goFilter("kok_neden_grup", v)} />
        </ChartCard>
        <div style={{ height: 16 }} />
        <ChartCard title="Pareto · Top 15 Detay" count="80/20">
          <ParetoChart data={d.paretoDetay} />
        </ChartCard>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Son Aktivite</h2>
          <span className="meta">Tıklayarak detaya gidin</span>
        </div>
        <RecentTickets />
      </div>
    </div>
  );
}

function Metric({ label, value, detail, variant }: { label: string; value: number | string; detail: string; variant?: "danger" | "warn" | "info" | "success" }) {
  return (
    <div className={`metric ${variant ?? ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function ChartCard({ title, count, hint, children }: { title: string; count: string | number; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card tall">
      <div className="card-head">
        <h3>{title}</h3>
        <span className="total">{hint ? `${hint} · ${count}` : count}</span>
      </div>
      {children}
    </div>
  );
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function RecentTickets() {
  const list = useQuery({
    queryKey: ["tickets", "recent"],
    queryFn: () => api.tickets({ page: 1, limit: 15 }),
    refetchInterval: 60_000,
  });
  if (!list.data) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Yükleniyor…</p>;
  return (
    <div className="card" style={{ padding: 0 }}>
      <table className="tickets-table">
        <thead>
          <tr>
            <th>ID</th><th>Tarih</th><th>Operatör</th><th>Süreç</th><th>Kök Neden</th><th>Özet</th>
          </tr>
        </thead>
        <tbody>
          {list.data.items.map((t) => (
            <tr key={t.bildirimNo} onClick={() => (window.location.href = `/tickets/${t.bildirimNo}`)}>
              <td><Link href={`/tickets/${t.bildirimNo}`}><span className="id">#{t.bildirimNo}</span></Link></td>
              <td className="when">{t.gdt.slice(0, 16).replace("T", " ")}</td>
              <td>{t.kullanici ?? "—"}</td>
              <td>{t.isSureci}</td>
              <td>{t.kokNedenGrup}</td>
              <td className="summary">{t.preview}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
