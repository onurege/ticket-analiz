"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus, RefreshCw, Filter } from "lucide-react";
import {
  TicketStatusBadge,
  type TicketStatus,
} from "@/components/cc/badges";

type Ticket = {
  id: number;
  ticket_no: string;
  status: TicketStatus;
  customer_name: string | null;
  project: string | null;
  description: string;
  category_id: string | null;
  category_sub: string | null;
  root_cause_id: string | null;
  root_cause_sub: string | null;
  // v3 sınıflandırma alanları
  open_urun: string | null;
  open_platform: string | null;
  open_is_sureci: string | null;
  open_islem_tipi: string | null;
  open_etkilenen_nesne: string | null;
  assigned_to: number | null;
  escalated_to_role: string | null;
  opened_at: string;
  ai_ran: number;
};

type User = {
  id: number;
  name: string;
  role: string;
};

const STATUS_FILTERS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "all", label: "Hepsi" },
  { id: "open", label: "Açık" },
  { id: "in_progress", label: "İşlemde" },
  { id: "escalated", label: "L2'de" },
  { id: "closed", label: "Kapalı" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function CcQueuePage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [me, setMe] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      const [res, meRes] = await Promise.all([
        fetch(`/api/cc-tickets?${params}`),
        me ? Promise.resolve(null) : fetch("/api/auth/me"),
      ]);
      if (meRes) {
        const meData = (await meRes.json()) as { user?: User };
        setMe(meData.user ?? null);
      }
      const data = (await res.json()) as {
        tickets?: Ticket[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      setTickets(data.tickets ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter, me]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Çağrı Merkezi
          </h1>
          <p className="text-sm text-muted mt-1">
            Ticket kayıtları — rolünüze göre filtrelenmiş havuz.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            onClick={load}
          >
            Yenile
          </Button>
          <Link href="/support/cc/new">
            <Button variant="primary" iconLeft={<Plus size={14} />}>
              Yeni Ticket
            </Button>
          </Link>
        </div>
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-muted ml-1" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                "px-3 h-7 text-xs rounded-md font-medium transition-colors " +
                (filter === f.id
                  ? "bg-[var(--color-accent-soft)] text-accent"
                  : "text-muted hover:text-fg hover:bg-surface-2")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card tone="muted" padding="lg">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner size={14} /> Yükleniyor…
          </div>
        </Card>
      )}

      {error && (
        <Card tone="bad" padding="lg">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {tickets && tickets.length === 0 && !loading && (
        <Card tone="muted" padding="lg">
          <p className="text-sm text-muted">
            Bu görünümde gösterilecek ticket yok.
          </p>
        </Card>
      )}

      {tickets && tickets.length > 0 && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="text-left p-3">No</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-left p-3">Müşteri / Proje</th>
                <th className="text-left p-3">Konu</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-left p-3">Açılış</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2"
                >
                  <td className="p-3 font-mono text-xs">{t.ticket_no}</td>
                  <td className="p-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">
                      {t.customer_name ?? "—"}
                    </div>
                    <div className="text-[11px] text-muted">
                      {t.project ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 max-w-md">
                    <p className="text-xs leading-relaxed text-fg-2 line-clamp-2">
                      {t.description}
                    </p>
                  </td>
                  <td className="p-3 text-xs text-fg-2">
                    {/* v3 sınıflandırma: üst satır = Etkilenen Nesne (en spesifik),
                        alt satır = İş Süreci + opsiyonel Platform pill */}
                    {t.open_etkilenen_nesne || t.open_is_sureci ? (
                      <>
                        <div className="font-medium">
                          {t.open_etkilenen_nesne ?? t.open_is_sureci}
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
                          {t.open_etkilenen_nesne && t.open_is_sureci && (
                            <span>{t.open_is_sureci}</span>
                          )}
                          {t.open_platform && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-2 text-[9px] uppercase tracking-wider font-mono">
                              {t.open_platform}
                            </span>
                          )}
                          {t.open_urun && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-2 text-[9px] uppercase tracking-wider font-mono">
                              {t.open_urun}
                            </span>
                          )}
                        </div>
                      </>
                    ) : t.category_id ? (
                      // Eski v1 fallback — sadece v3 alanları boşsa
                      <>
                        <div className="text-muted italic">
                          {t.category_sub ?? t.category_id}
                        </div>
                        {t.root_cause_sub && (
                          <div className="text-[10px] text-muted">
                            {t.root_cause_sub}
                          </div>
                        )}
                        <div className="text-[9px] text-muted/60 mt-0.5">
                          (eski sınıflandırma)
                        </div>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-muted whitespace-nowrap">
                    {fmtDate(t.opened_at)}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/support/cc/${t.id}`}>
                      <Button variant="ghost" size="sm">
                        Aç
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {me && (
        <p className="text-[10px] text-muted text-right">
          Görüntüleyen: {me.name} ({me.role})
        </p>
      )}
    </div>
  );
}
