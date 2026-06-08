import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./severity-badge";
import { UrgentFlag } from "./urgent-flag";

type AnyMatched = {
  // TicketRow şekli
  Bildirim_No?: number;
  Bildirim_Tarihi_?: string | Date | null;
  Bildirim_Tipi?: string | null;
  Oncelik?: string | null;
  Acil_Ticket?: string | null;
  Katman?: string | null;
  PROJE?: string | null;
  Urun?: string | null;
  Uzun_Kategori_Adi?: string | null;
  Konunun_Kok_Nedeni?: string | null;
  Bildirim_Aciklamasi?: string | null;
  Cozum_Aciklamasi?: string | null;
  BugGroup?: string | null;
  TfsNo?: number | null;
  TfsTip?: string | null;
  Support_L1_L2?: string | null;
  // LocalTicket şekli
  bildirim_no?: number;
  bildirim_tarihi?: string | null;
  bildirim_tipi?: string | null;
  oncelik?: string | null;
  acil_ticket?: string | null;
  katman?: string | null;
  proje?: string | null;
  urun?: string | null;
  kategori_uzun?: string | null;
  kok_neden?: string | null;
  aciklama?: string | null;
  cozum?: string | null;
  bug_group?: string | null;
  tfs_no?: number | null;
  tfs_tip?: string | null;
  support_seviye?: string | null;
};

function pick<T>(t: AnyMatched, a: keyof AnyMatched, b: keyof AnyMatched): T | null {
  const v = (t[a] ?? t[b]) as T | null | undefined;
  return v ?? null;
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function MatchedRecordCard({ row }: { row: AnyMatched }) {
  const id = pick<number>(row, "Bildirim_No", "bildirim_no");
  const date = pick<string | Date>(row, "Bildirim_Tarihi_", "bildirim_tarihi");
  const tipi = pick<string>(row, "Bildirim_Tipi", "bildirim_tipi");
  const oncelik = pick<string>(row, "Oncelik", "oncelik");
  const acil = pick<string>(row, "Acil_Ticket", "acil_ticket");
  const katman = pick<string>(row, "Katman", "katman");
  const proje = pick<string>(row, "PROJE", "proje");
  const urun = pick<string>(row, "Urun", "urun");
  const kategori = pick<string>(row, "Uzun_Kategori_Adi", "kategori_uzun");
  const kokNeden = pick<string>(row, "Konunun_Kok_Nedeni", "kok_neden");
  const aciklama = pick<string>(row, "Bildirim_Aciklamasi", "aciklama");
  const cozum = pick<string>(row, "Cozum_Aciklamasi", "cozum");
  const bugGroup = pick<string>(row, "BugGroup", "bug_group");
  const tfsNo = pick<number>(row, "TfsNo", "tfs_no");
  const tfsTip = pick<string>(row, "TfsTip", "tfs_tip");
  const support = pick<string>(row, "Support_L1_L2", "support_seviye");

  return (
    <Card padding="lg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <CardHeader>Eşleşen Bildirim</CardHeader>
          <CardTitle>#{id}</CardTitle>
          <div className="text-xs text-muted mt-1">
            {fmtDate(date)} · {tipi ?? "—"} · {urun ?? "—"} · {proje ?? "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <SeverityBadge value={oncelik} />
          <UrgentFlag value={acil} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-fg-2 mb-3">
        <Field label="Katman" value={katman} />
        <Field label="Support" value={support} />
        <Field label="Bug Group" value={bugGroup} />
        <Field label="TFS" value={tfsNo ? `#${tfsNo}${tfsTip ? " · " + tfsTip : ""}` : null} />
      </div>

      {kategori && (
        <div className="mb-2">
          <Badge tone="accent" size="md">
            {kategori}
          </Badge>
        </div>
      )}

      {kokNeden && (
        <div className="text-xs text-muted mb-3">
          <span className="uppercase tracking-wider mr-2">Kök Neden:</span>
          <span className="text-fg-2">{kokNeden}</span>
        </div>
      )}

      {aciklama && (
        <Section title="Açıklama">
          <Paragraph text={aciklama} />
        </Section>
      )}
      {cozum && (
        <Section title="Geçmiş Çözüm Notu">
          <Paragraph text={cozum} />
        </Section>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1">{title}</div>
      <div className="text-sm text-fg-2 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function Paragraph({ text }: { text: string }) {
  return <p className="leading-relaxed">{text}</p>;
}
