import { useState } from "react";
import { Route, Switch, Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./lib/api";
import Dashboard from "./routes/Dashboard";
import TicketDetail from "./routes/TicketDetail";
import TicketList from "./routes/TicketList";
import Categorize from "./routes/Categorize";

function TopBar() {
  const qc = useQueryClient();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 30_000 });
  const ok = health.data?.ok ?? false;
  const count = health.data?.cache.count ?? 0;
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  async function onFix() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.recategorize(true);
      const fetched = r.refresh?.fetched ?? 0;
      setLast(`✓ ${r.total} ticket: ${r.changed} düzeltildi${fetched > 0 ? `, ${fetched} yeni` : ""}`);
      await qc.invalidateQueries();
      setTimeout(() => setLast(null), 6_000);
    } catch (e) {
      setLast(`✗ Hata: ${(e as Error).message}`);
      setTimeout(() => setLast(null), 6_000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <div className="logo">EN</div>
        <div>
          <span className="name">EnRoute Service Desk</span>
          <span className="sub">Ticket Analytics — Canlı</span>
        </div>
      </div>
      <div className="topbar-meta">
        {last && <span className="filter" style={{ background: "rgba(34,197,94,0.15)" }}>{last}</span>}
        <button className="fix-btn" onClick={onFix} disabled={busy}>
          {busy ? "⟳ Düzeltiyor…" : "🔧 Düzelt"}
        </button>
        <span className="filter">{count.toLocaleString("tr-TR")} ticket</span>
        <span className="status">
          <span className="dot" style={{ background: ok ? "#22c55e" : "#dc2626" }} />
          {ok ? "Bağlı" : "Bağlantı yok"}
        </span>
      </div>
    </div>
  );
}

function SubNav() {
  const [location] = useLocation();
  const active = (path: string) =>
    location === path || (path === "/" && location === "");
  return (
    <nav className="subnav">
      <Link href="/v1" className={active("/v1") ? "active" : ""}>Genel Bakış v1 <span className="nav-sub">(eski)</span></Link>
      <Link href="/" className={active("/") ? "active" : ""}>Genel Bakış v2 <span className="nav-sub">(yeni)</span></Link>
      <Link href="/tickets" className={location.startsWith("/tickets") && location !== "/" ? "active" : ""}>
        Ticketlar
      </Link>
      <Link href="/categorize" className={active("/categorize") ? "active" : ""}>
        ✨ AI ile Kategorize
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <TopBar />
      <SubNav />
      <Switch>
        <Route path="/" component={() => <Dashboard version="v2" />} />
        <Route path="/v1" component={() => <Dashboard version="v1" />} />
        <Route path="/v2" component={() => <Dashboard version="v2" />} />
        <Route path="/tickets" component={TicketList} />
        <Route path="/tickets/:id">{(params) => <TicketDetail id={Number(params.id)} />}</Route>
        <Route path="/categorize" component={Categorize} />
        <Route>
          <div className="wrap"><p>Sayfa bulunamadı.</p></div>
        </Route>
      </Switch>
    </>
  );
}
