"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, use } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Sparkles,
  Hand,
  AlertTriangle,
  Tag,
} from "lucide-react";
import {
  TicketStatusBadge,
  type TicketStatus,
  ROLE_LABELS,
  type Role,
} from "@/components/cc/badges";
import { SourceGuidanceCards } from "@/components/support/source-guidance-card";
import {
  CloseForm,
  isCloseFormValid,
  type CloseFormValues,
} from "@/components/cc/close-form";

type Ticket = {
  id: number;
  ticket_no: string;
  status: TicketStatus;
  channel: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  project: string | null;
  description: string;
  category_id: string | null;
  category_sub: string | null;
  root_cause_id: string | null;
  root_cause_sub: string | null;
  category_reason: string | null;
  analysis_id: string | null;
  ai_ran: number;
  ai_root_cause: string | null;
  ai_steps: string | null;
  ai_customer_reply: string | null;
  ai_handoff: string | null;
  ai_n4b_guidance: string | null;
  ai_other_docs_guidance: string | null;
  ai_input_tokens: number | null;
  ai_output_tokens: number | null;
  ai_cost_usd: number | null;
  ai_model: string | null;
  // v2 sınıflandırma
  open_urun: string | null;
  open_platform: string | null;
  open_is_sureci: string | null;
  open_islem_tipi: string | null;
  open_etkilenen_nesne: string | null;
  open_etki: string | null;
  close_kok_neden_grubu: string | null;
  close_kok_neden_detayi: string | null;
  close_cozum_tipi: string | null;
  close_kalici_onlem: string | null;
  kb_citations: string | null;
  agent_resolution: string | null;
  opened_by: number | null;
  assigned_to: number | null;
  escalated_to_role: string | null;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

type Event = {
  id: number;
  ticket_id: number;
  actor_id: number | null;
  event_type: string;
  payload_json: string | null;
  created_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type Step = { step: string; rationale?: string | null };
type Hypothesis = { text: string; confidence: number };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
}

function ClassRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-fg-2">
        {value ? value : <span className="text-muted italic">—</span>}
      </dd>
    </div>
  );
}

function safeJson<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolutionDirty, setResolutionDirty] = useState(false);
  const [closeForm, setCloseForm] = useState<CloseFormValues>({
    close_kok_neden_grubu: "",
    close_kok_neden_detayi: "",
    close_cozum_tipi: "",
    close_kalici_onlem: null,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [showAssignList, setShowAssignList] = useState(false);
  const [creationWarning, setCreationWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, meRes] = await Promise.all([
        fetch(`/api/cc-tickets/${id}`),
        fetch("/api/auth/me"),
      ]);
      const tData = (await tRes.json()) as {
        ticket?: Ticket;
        events?: Event[];
        error?: string;
      };
      if (!tRes.ok || !tData.ticket) {
        throw new Error(tData.error || `Hata ${tRes.status}`);
      }
      setTicket(tData.ticket);
      setEvents(tData.events ?? []);
      // Çözüm metnini pre-fill: agent_resolution > ai_customer_reply
      const pre =
        tData.ticket.agent_resolution ??
        tData.ticket.ai_customer_reply ??
        "";
      setResolution(pre);
      setResolutionDirty(false);
      // Mevcut kapanış alanlarını forma yükle (yenileme veya kısmi doldurulmuş)
      setCloseForm({
        close_kok_neden_grubu: tData.ticket.close_kok_neden_grubu ?? "",
        close_kok_neden_detayi: tData.ticket.close_kok_neden_detayi ?? "",
        close_cozum_tipi: tData.ticket.close_cozum_tipi ?? "",
        close_kalici_onlem: tData.ticket.close_kalici_onlem ?? null,
      });
      const meData = (await meRes.json()) as { user?: User };
      setMe(meData.user ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Yeni ticket oluşturma sayfasından gelen uyarı varsa göster (bir kerelik)
  useEffect(() => {
    const w = sessionStorage.getItem(`cc-warn-${id}`);
    if (w) {
      setCreationWarning(w);
      sessionStorage.removeItem(`cc-warn-${id}`);
    }
  }, [id]);

  async function loadUsers(): Promise<void> {
    if (allUsers !== null) return;
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = (await res.json()) as { users?: User[] };
        setAllUsers(data.users ?? []);
      } else {
        // Yetki yoksa boş bırak — me dışındaki kullanıcılar gösterilmesin
        setAllUsers([]);
      }
    } catch {
      setAllUsers([]);
    }
  }

  async function action(
    path: string,
    body?: object,
    busyLabel?: string,
  ): Promise<void> {
    setBusy(busyLabel ?? path);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = (await res.json()) as {
        ticket?: Ticket;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function saveResolution(): Promise<void> {
    if (!ticket) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/cc-tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_resolution: resolution }),
      });
      const data = (await res.json()) as {
        ticket?: Ticket;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      setResolutionDirty(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading || !ticket) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner size={14} /> Yükleniyor…
        {error && <span className="text-bad">— {error}</span>}
      </div>
    );
  }

  const aiSteps = safeJson<Step[]>(ticket.ai_steps);
  const aiHypotheses = safeJson<Hypothesis[]>(ticket.ai_root_cause);
  const isClosed = ticket.status === "closed";
  const isL1Role = me?.role === "L1_agent" || me?.role === "L1_lead";
  const isL2Role = me?.role === "L2_agent" || me?.role === "L2_lead";

  return (
    <div className="flex flex-col gap-4">
      {/* Üst bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/support/cc">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={14} />}
            >
              Kuyruk
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight font-mono">
                {ticket.ticket_no}
              </h1>
              <TicketStatusBadge status={ticket.status} />
              {ticket.escalated_to_role && (
                <Badge tone="bad" size="sm">
                  → {ticket.escalated_to_role}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted mt-1">
              Açılış: {fmtDate(ticket.opened_at)}
              {ticket.closed_at && ` · Kapanış: ${fmtDate(ticket.closed_at)}`}
            </p>
          </div>
        </div>

        {/* Action butonları */}
        {!isClosed && (
          <div className="flex flex-wrap gap-2 justify-end">
            {ticket.assigned_to !== me?.id && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Hand size={14} />}
                loading={busy === "take"}
                onClick={() => action(`/api/cc-tickets/${ticket.id}/assign`, {}, "take")}
              >
                Üstlen
              </Button>
            )}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<UserPlus size={14} />}
                onClick={() => {
                  setShowAssignList((x) => !x);
                  loadUsers();
                }}
              >
                Ata
              </Button>
              {showAssignList && (
                <div className="absolute right-0 top-full mt-1 z-10 w-64 max-h-72 overflow-auto bg-surface border border-border rounded-md shadow-lg">
                  {allUsers === null ? (
                    <div className="p-3 text-xs text-muted">Yükleniyor…</div>
                  ) : allUsers.length === 0 ? (
                    <div className="p-3 text-xs text-muted">
                      Kullanıcı listesine erişiminiz yok.
                    </div>
                  ) : (
                    <ul className="text-xs">
                      {allUsers.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            disabled={busy === "assign"}
                            onClick={() => {
                              setShowAssignList(false);
                              action(
                                `/api/cc-tickets/${ticket.id}/assign`,
                                { user_id: u.id },
                                "assign",
                              );
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-surface-2 flex justify-between items-center"
                          >
                            <span>{u.name}</span>
                            <span className="text-[10px] text-muted">
                              {ROLE_LABELS[u.role]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {isL1Role && ticket.status !== "escalated" && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ArrowUp size={14} />}
                loading={busy === "escalate"}
                onClick={() => action(`/api/cc-tickets/${ticket.id}/escalate`, {}, "escalate")}
              >
                L2'ye Devr Et
              </Button>
            )}
            {isL2Role && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ArrowDown size={14} />}
                loading={busy === "deescalate"}
                onClick={() => action(`/api/cc-tickets/${ticket.id}/deescalate`, {}, "deescalate")}
              >
                L1'e Geri Gönder
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Sparkles size={14} />}
              loading={busy === "analyze"}
              onClick={() => {
                // Önceki sonuçların üstüne yazıldığı için onayla
                if (
                  ticket.ai_ran === 1 &&
                  !confirm(
                    "AI analizi zaten çalıştırılmış. Yeniden çalıştırmak mevcut sonuçların üstüne yazacak. Devam edilsin mi?",
                  )
                ) {
                  return;
                }
                action(`/api/cc-tickets/${ticket.id}/analyze`, {}, "analyze");
              }}
            >
              {ticket.ai_ran === 0 ? "AI Analiz Çalıştır" : "AI Analiz Yenile"}
            </Button>
            {/* v2 sınıflandırma yoksa "AI Sınıflandır" butonu görünür.
                Hem yeni boş ticket'lar hem eski v1-only ticket'lar için. */}
            {!ticket.open_urun &&
              !ticket.open_platform &&
              !ticket.open_is_sureci &&
              !ticket.open_islem_tipi && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Tag size={14} />}
                  loading={busy === "categorize"}
                  onClick={() =>
                    action(
                      `/api/cc-tickets/${ticket.id}/categorize`,
                      {},
                      "categorize",
                    )
                  }
                >
                  AI ile Sınıflandır
                </Button>
              )}
          </div>
        )}
      </div>

      {creationWarning && (
        <Card tone="warn" padding="md">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                Ticket açıldı, ancak bazı otomatik adımlar başarısız oldu
              </p>
              <p className="text-xs text-fg-2 mt-1">{creationWarning}</p>
              <p className="text-xs text-muted mt-2">
                Yukarıdaki butonlarla{" "}
                <strong>"AI Analiz Çalıştır"</strong> ve{" "}
                <strong>"Kategorize Et"</strong> ile tekrar deneyebilirsiniz.
                Hata devam ederse dev server log'una bakın.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setCreationWarning(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card tone="bad" padding="md">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol — Bağlam */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card padding="lg">
            <CardHeader>Müşteri</CardHeader>
            <CardTitle className="mb-2">
              {ticket.customer_name ?? "—"}
            </CardTitle>
            <div className="text-xs text-fg-2 space-y-1">
              {ticket.project && (
                <div>
                  <span className="text-muted">Proje:</span> {ticket.project}
                </div>
              )}
              {ticket.customer_phone && (
                <div>
                  <span className="text-muted">Telefon:</span>{" "}
                  {ticket.customer_phone}
                </div>
              )}
              {ticket.customer_email && (
                <div>
                  <span className="text-muted">E-posta:</span>{" "}
                  {ticket.customer_email}
                </div>
              )}
              {ticket.channel && (
                <div>
                  <span className="text-muted">Kanal:</span> {ticket.channel}
                </div>
              )}
            </div>
          </Card>

          {/*
            Eski (v1) sınıflandırma kartı — sadece v1 verisi varken ve henüz
            v2'ye geçirilmemiş ticket'lar için görünür. v2 mevcutsa veya
            ticket yeni açıldıysa gizlenir.
          */}
          {ticket.category_id &&
            !ticket.open_urun &&
            !ticket.open_platform &&
            !ticket.open_is_sureci && (
              <Card padding="lg" tone="muted">
                <CardHeader>Eski Sınıflandırma (legacy)</CardHeader>
                <p className="text-[10px] text-muted mt-0.5">
                  Bu ticket eski şemayla açılmış. Yenilemek için "Kategorize
                  Et" butonuna basın.
                </p>
                <div className="text-xs space-y-2 mt-3">
                  <div>
                    <span className="text-muted uppercase tracking-wider text-[10px]">
                      Kategori
                    </span>
                    <div className="mt-0.5">
                      <Badge tone="accent" size="sm">
                        {ticket.category_id}
                      </Badge>
                      {ticket.category_sub && (
                        <span className="ml-2 text-fg-2">{ticket.category_sub}</span>
                      )}
                    </div>
                  </div>
                  {ticket.root_cause_id && (
                    <div>
                      <span className="text-muted uppercase tracking-wider text-[10px]">
                        Kök Neden
                      </span>
                      <div className="mt-0.5">
                        <Badge tone="warn" size="sm">
                          {ticket.root_cause_id}
                        </Badge>
                        {ticket.root_cause_sub && (
                          <span className="ml-2 text-fg-2">
                            {ticket.root_cause_sub}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {ticket.category_reason && (
                    <p className="text-[11px] text-muted italic">
                      {ticket.category_reason}
                    </p>
                  )}
                </div>
              </Card>
            )}

          {(ticket.open_urun ||
            ticket.open_platform ||
            ticket.open_is_sureci ||
            ticket.open_islem_tipi ||
            ticket.open_etkilenen_nesne ||
            ticket.open_etki) && (
            <Card padding="lg">
              <CardHeader>Sınıflandırma — Açılış</CardHeader>
              <p className="text-[10px] text-muted mt-0.5">
                Müşteri dili · 6 alan (cc-taxonomy v3)
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <ClassRow label="Ürün" value={ticket.open_urun} />
                <ClassRow label="Platform" value={ticket.open_platform} />
                <ClassRow label="İş Süreci" value={ticket.open_is_sureci} />
                <ClassRow label="İşlem Tipi" value={ticket.open_islem_tipi} />
                <ClassRow label="Etkilenen Nesne" value={ticket.open_etkilenen_nesne} />
                <ClassRow label="Etki" value={ticket.open_etki} />
              </dl>
            </Card>
          )}

          {(ticket.close_kok_neden_grubu ||
            ticket.close_cozum_tipi ||
            ticket.close_kalici_onlem) && (
            <Card padding="lg" tone="good">
              <CardHeader>Sınıflandırma — Kapanış</CardHeader>
              <p className="text-[10px] text-muted mt-0.5">
                Destek dili · ticket kapatılırken
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                {ticket.close_kok_neden_grubu && (
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted">
                      Kök Neden
                    </dt>
                    <dd className="mt-0.5 text-fg-2">
                      <span className="font-medium">
                        {ticket.close_kok_neden_grubu}
                      </span>
                      {ticket.close_kok_neden_detayi && (
                        <>
                          <span className="text-muted mx-1">›</span>
                          {ticket.close_kok_neden_detayi}
                        </>
                      )}
                    </dd>
                  </div>
                )}
                <ClassRow label="Çözüm Tipi" value={ticket.close_cozum_tipi} />
                <ClassRow label="Kalıcı Önlem" value={ticket.close_kalici_onlem} />
              </dl>
            </Card>
          )}

          <Card padding="lg">
            <CardHeader>Olay Akışı</CardHeader>
            {events.length === 0 ? (
              <p className="text-xs text-muted">Henüz event yok.</p>
            ) : (
              <ul className="text-xs space-y-2 mt-1">
                {events.map((e) => (
                  <li key={e.id} className="border-l-2 border-border pl-2">
                    <div className="font-medium">{e.event_type}</div>
                    <div className="text-[11px] text-muted">
                      {fmtDate(e.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {ticket.ai_ran === 1 && ticket.ai_cost_usd != null && (
            <Card padding="lg" tone="muted">
              <CardHeader>AI Maliyet</CardHeader>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    Tahmini
                  </span>
                  <span className="text-base font-semibold font-mono">
                    ${ticket.ai_cost_usd.toFixed(4)}
                  </span>
                </div>
                <div className="text-[11px] text-muted space-y-0.5">
                  {ticket.ai_model && (
                    <div>
                      <span className="opacity-70">Model:</span>{" "}
                      <span className="font-mono">{ticket.ai_model}</span>
                    </div>
                  )}
                  {ticket.ai_input_tokens != null && (
                    <div>
                      <span className="opacity-70">Input:</span>{" "}
                      <span className="font-mono">
                        {ticket.ai_input_tokens.toLocaleString("tr-TR")} tok
                      </span>
                    </div>
                  )}
                  {ticket.ai_output_tokens != null && (
                    <div>
                      <span className="opacity-70">Output:</span>{" "}
                      <span className="font-mono">
                        {ticket.ai_output_tokens.toLocaleString("tr-TR")} tok
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Orta + Sağ — AI önerileri + çözüm */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card padding="lg">
            <CardHeader>Sorun (Müşteriden)</CardHeader>
            <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap mt-1">
              {ticket.description}
            </p>
          </Card>

          {ticket.ai_ran === 1 && aiHypotheses && aiHypotheses.length > 0 && (
            <Card padding="lg">
              <CardHeader>AI Kök Neden Hipotezleri</CardHeader>
              <ul className="text-sm space-y-1 mt-2">
                {aiHypotheses.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted text-xs mt-0.5">
                      {Math.round(h.confidence * 100)}%
                    </span>
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {ticket.ai_ran === 1 && (
            <SourceGuidanceCards
              n4bGuidance={ticket.ai_n4b_guidance}
              otherDocsGuidance={ticket.ai_other_docs_guidance}
            />
          )}

          {ticket.ai_ran === 1 && aiSteps && aiSteps.length > 0 && (
            <Card padding="lg">
              <CardHeader>AI Önerilen Adımlar</CardHeader>
              <ol className="text-sm space-y-2 mt-2 list-decimal pl-5">
                {aiSteps.map((s, i) => (
                  <li key={i}>
                    <div>{s.step}</div>
                    {s.rationale && (
                      <p className="text-[11px] text-muted mt-0.5">{s.rationale}</p>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {ticket.ai_handoff && (
            <Card padding="lg">
              <CardHeader>Mühendislik Notu</CardHeader>
              <p className="text-xs text-fg-2 leading-relaxed mt-2 whitespace-pre-wrap">
                {ticket.ai_handoff}
              </p>
            </Card>
          )}

          <Card padding="lg" tone={isClosed ? "muted" : "good"}>
            <CardHeader>Çözüm Notu</CardHeader>
            <CardTitle>
              {isClosed ? "Kapatma metni" : "Çözüm taslağı (düzenlenebilir)"}
            </CardTitle>
            <textarea
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                setResolutionDirty(true);
              }}
              disabled={isClosed || !!busy}
              rows={8}
              placeholder="Çözüm adımlarını ve uygulanan işlemi buraya yazın. AI varsa müşteri yanıt taslağı önceden yüklenmiştir."
              className="w-full text-sm bg-surface border border-border rounded-md p-3 mt-2 leading-relaxed"
            />

            {!isClosed && (
              <>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[11px] uppercase tracking-wider text-muted mb-1">
                    Kapanış sınıflandırması
                  </p>
                  <p className="text-[10px] text-muted">
                    Ticket'ı kapatmadan önce destek dilinde 3 alanı doldur.
                  </p>
                  <CloseForm
                    value={closeForm}
                    onChange={setCloseForm}
                    disabled={!!busy}
                    ticketId={ticket.id}
                    resolution={resolution}
                  />
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  {resolutionDirty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Save size={14} />}
                      loading={busy === "save"}
                      onClick={saveResolution}
                    >
                      Taslağı Kaydet
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<CheckCircle2 size={14} />}
                    loading={busy === "close"}
                    disabled={
                      resolution.trim().length < 5 ||
                      !isCloseFormValid(closeForm)
                    }
                    onClick={() => {
                      if (
                        !confirm(
                          "Bu ticket'ı kapatmak istediğinize emin misiniz? Kapatma sonrası değişiklik yapılamaz.",
                        )
                      )
                        return;
                      action(
                        `/api/cc-tickets/${ticket.id}/close`,
                        {
                          resolution,
                          ...closeForm,
                        },
                        "close",
                      );
                    }}
                  >
                    Çöz ve Kapat
                  </Button>
                </div>
              </>
            )}
          </Card>

          {me && (
            <p className="text-[10px] text-muted text-right">
              Görüntüleyen: {me.name} ({me.role})
              {ticket.assigned_to && ` · Atanmış: #${ticket.assigned_to}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
