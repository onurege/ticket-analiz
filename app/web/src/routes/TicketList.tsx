import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type Filter = {
  is_sureci?: string;
  islem_tipi?: string;
  etkilenen_nesne?: string;
  etki?: string;
  kok_neden_grup?: string;
  kok_neden_detay?: string;
  cozum_tipi?: string;
  kullanici?: string;
};

const FILTER_KEYS = ["is_sureci","islem_tipi","etkilenen_nesne","etki","kok_neden_grup","kok_neden_detay","cozum_tipi","kullanici"] as const;
const FILTER_LABELS: Record<string,string> = {
  is_sureci: "İş Süreci",
  islem_tipi: "İşlem Tipi",
  etkilenen_nesne: "Nesne",
  etki: "Etki",
  kok_neden_grup: "Kök Neden",
  kok_neden_detay: "Kök Neden Detay",
  cozum_tipi: "Çözüm Tipi",
  kullanici: "Operatör",
};

export default function TicketList() {
  const search_str = useSearch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(() => parseUrlFilter(search_str));

  // URL değiştiğinde filter'ı senkronize et (dashboard'dan tıklayınca anında uygulansın)
  useEffect(() => {
    setFilter(parseUrlFilter(search_str));
    setPage(1);
  }, [search_str]);

  const stats = useQuery({ queryKey: ["stats"], queryFn: api.stats });

  const q: Record<string, string | number> = { page, limit: 30 };
  if (search.length >= 2) q.search = search;
  for (const [k, v] of Object.entries(filter)) if (v) q[k] = v;

  const list = useQuery({
    queryKey: ["tickets", q],
    queryFn: () => api.tickets(q),
    placeholderData: (prev) => prev,
  });

  const surecler = stats.data ? Object.keys(stats.data.isSureci) : [];
  const koks = stats.data ? Object.keys(stats.data.kokNedenGrup) : [];
  const ops = stats.data ? Object.keys(stats.data.operatorCount) : [];

  // URL'den gelen aktif filtreleri pill olarak göster
  const activeFilters = FILTER_KEYS.filter((k) => filter[k]);

  return (
    <div className="wrap">
      <h1 className="page-title">Ticketlar</h1>
      <p className="page-sub">
        Toplam <strong>{list.data?.total ?? "…"}</strong> kayıt
        {list.data ? ` · sayfa ${list.data.page}/${list.data.pages}` : ""}
      </p>

      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map((k) => (
            <span key={k} className="filter-pill">
              <span className="filter-pill-label">{FILTER_LABELS[k]}:</span>
              <strong>{filter[k]}</strong>
              <button onClick={() => { const nf = { ...filter }; delete nf[k]; setFilter(nf); setPage(1); }} title="Kaldır">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <input
          placeholder="Çözüm metninde ara…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={filter.is_sureci ?? ""} onChange={(e) => { setFilter({ ...filter, is_sureci: e.target.value || undefined }); setPage(1); }}>
          <option value="">Tüm süreçler</option>
          {surecler.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.kok_neden_grup ?? ""} onChange={(e) => { setFilter({ ...filter, kok_neden_grup: e.target.value || undefined }); setPage(1); }}>
          <option value="">Tüm kök nedenler</option>
          {koks.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.kullanici ?? ""} onChange={(e) => { setFilter({ ...filter, kullanici: e.target.value || undefined }); setPage(1); }}>
          <option value="">Tüm operatörler</option>
          {ops.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="ghost" onClick={() => { setSearch(""); setFilter({}); setPage(1); }}>Temizle</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th><th>Tarih</th><th>Operatör</th><th>Süreç</th><th>Kök Neden</th><th>Çözüm Tipi</th><th>Özet</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && !list.data && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Yükleniyor…</td></tr>
            )}
            {list.data?.items.map((t) => (
              <tr key={t.bildirimNo} onClick={() => (window.location.href = `/tickets/${t.bildirimNo}`)}>
                <td><Link href={`/tickets/${t.bildirimNo}`}><span className="id">#{t.bildirimNo}</span></Link></td>
                <td className="when">{t.gdt.slice(0, 16).replace("T", " ")}</td>
                <td>{t.kullanici ?? "—"}</td>
                <td>{t.isSureci}</td>
                <td>{t.kokNedenGrup}</td>
                <td>{t.cozumTipi}</td>
                <td className="summary">{t.preview}…</td>
              </tr>
            ))}
            {list.data && list.data.items.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Sonuç yok.</td></tr>
            )}
          </tbody>
        </table>
        {list.data && list.data.pages > 1 && (
          <div className="pager">
            <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button onClick={() => setPage(page - 1)} disabled={page <= 1}>‹</button>
            <span>sayfa <strong>{page}</strong> / {list.data.pages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= list.data.pages}>›</button>
            <button onClick={() => setPage(list.data.pages)} disabled={page >= list.data.pages}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}

function parseUrlFilter(search: string): Filter {
  const p = new URLSearchParams(search);
  const f: Filter = {};
  for (const k of FILTER_KEYS) {
    const v = p.get(k);
    if (v) f[k] = v;
  }
  return f;
}
