import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "../lib/api";

export default function TicketDetail({ id }: { id: number }) {
  const q = useQuery({ queryKey: ["ticket", id], queryFn: () => api.ticket(id), enabled: Number.isInteger(id) });

  if (q.isLoading) return <div className="wrap"><p>Yükleniyor…</p></div>;
  if (q.error || !q.data) return <div className="wrap"><p style={{ color: "var(--p1)" }}>Ticket bulunamadı.</p></div>;

  const { ticket, operatorStats } = q.data;
  const prioMap: Record<string, { cls: string; lbl: string }> = {
    "İş tamamen durdu": { cls: "p1", lbl: "P1 · KRİTİK" },
    "Tüm kullanıcılar / distribütör etkileniyor": { cls: "p2", lbl: "P2 · YÜKSEK" },
    "Tek kullanıcı etkileniyor": { cls: "p4", lbl: "P4 · NORMAL" },
  };
  const prio = prioMap[ticket.etki] ?? { cls: "muted", lbl: "—" };

  return (
    <div className="wrap">
      <div className="detail-header">
        <Link href="/tickets" className="back">← Tüm ticketlara dön</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <span className="ticket-id">#{ticket.bildirimNo}</span>
          <span className={`chip ${prio.cls}`}>{prio.lbl}</span>
        </div>
        <div className="meta-line">
          <span>📅 <strong>{formatDateTime(ticket.gdt)}</strong></span>
          <span>👤 <strong>{ticket.kullanici ?? "—"}</strong>{operatorStats && ` · ${operatorStats.tickets} ticket · ort. ${operatorStats.avgChars} karakter`}</span>
          <span>📝 <strong>{ticket.cozumLen}</strong> karakter</span>
          <span>🤖 {ticket.reason} · %{(ticket.confidence * 100).toFixed(0)}</span>
        </div>

        <div className="detail-tags">
          <Tag cls="surec" lbl="Kategori" val={ticket.isSureci} link={`/tickets?is_sureci=${encodeURIComponent(ticket.isSureci)}`} />
          <Tag cls="nesne" lbl="Etkilenen Nesne" val={ticket.etkilenenNesne} link={`/tickets?etkilenen_nesne=${encodeURIComponent(ticket.etkilenenNesne)}`} />
          {ticket.platform && (
            <Tag cls="platform" lbl="Platform" val={ticket.platform} link={`/tickets?platform=${encodeURIComponent(ticket.platform)}`} />
          )}
          <Tag cls="islem" lbl="Problem Tipi" val={ticket.islemTipi} link={`/tickets?islem_tipi=${encodeURIComponent(ticket.islemTipi)}`} />
          <Tag cls="kok" lbl="Kök Neden Grubu" val={ticket.kokNedenGrup} link={`/tickets?kok_neden_grup=${encodeURIComponent(ticket.kokNedenGrup)}`} />
          <Tag cls="kok" lbl="Kök Neden Detayı" val={ticket.kokNedenDetay} link={`/tickets?kok_neden_detay=${encodeURIComponent(ticket.kokNedenDetay)}`} />
          <Tag cls="cozum" lbl="Çözüm Tipi" val={ticket.cozumTipi} link={`/tickets?cozum_tipi=${encodeURIComponent(ticket.cozumTipi)}`} />
          <Tag cls="etki" lbl="İş Etkisi" val={ticket.etki} link={`/tickets?etki=${encodeURIComponent(ticket.etki)}`} />
          {ticket.selfServis && (
            <Tag cls={ticket.selfServis.startsWith("Evet") ? "self-yes" : ticket.selfServis.startsWith("Kısmi") ? "self-partial" : "self-no"}
                 lbl="Self-Servis" val={ticket.selfServis} link={`/tickets?self_servis=${encodeURIComponent(ticket.selfServis)}`} />
          )}
        </div>
      </div>

      {ticket.musteriSorunu && ticket.musteriSorunu.length > 5 && (
        <div className="detail-block musteri">
          <div className="detail-block-label">MÜŞTERİ SORUSU</div>
          <p>{ticket.musteriSorunu}</p>
        </div>
      )}

      {ticket.tespitSorun && ticket.tespitSorun.length > 3 && (
        <div className="detail-block tespit">
          <div className="detail-block-label">OPERATÖR TESPİTİ</div>
          <p>{ticket.tespitSorun}</p>
        </div>
      )}

      <div className="detail-block cozum">
        <div className="detail-block-label">ÇÖZÜM NOTU</div>
        <p>{ticket.cozumText}</p>
      </div>
    </div>
  );
}

function Tag({ cls, lbl, val, link }: { cls: string; lbl: string; val: string; link: string }) {
  return (
    <Link href={link}>
      <div className={`detail-tag ${cls}`}>
        <span className="lbl">{lbl}</span>
        <span className="val">{val}</span>
      </div>
    </Link>
  );
}

function formatDateTime(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso;
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${m[3]} ${aylar[parseInt(m[2]) - 1]} ${m[1]} · ${m[4]}:${m[5]}`;
}
