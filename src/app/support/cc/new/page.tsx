"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, FilePlus, ArrowLeft, Wand2 } from "lucide-react";
import { OpenForm, EMPTY_OPEN_VALUES, type OpenFormValues } from "@/components/cc/open-form";

type Ticket = {
  id: number;
  ticket_no: string;
};

const CHANNELS = [
  { id: "phone", label: "Telefon" },
  { id: "email", label: "E-posta" },
  { id: "chat", label: "Chat" },
  { id: "manual", label: "Manuel" },
] as const;

export default function NewTicketPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [project, setProject] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["id"]>(
    "phone",
  );
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState<"analyze" | "quick" | "suggest" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openValues, setOpenValues] = useState<OpenFormValues>(EMPTY_OPEN_VALUES);
  const [suggestInfo, setSuggestInfo] = useState<string | null>(null);

  async function suggestOpen(): Promise<void> {
    if (description.trim().length < 5) {
      setError("Önce sorun açıklamasını yazın (en az 5 karakter).");
      return;
    }
    setBusy("suggest");
    setError(null);
    setSuggestInfo(null);
    try {
      const res = await fetch("/api/cc-tickets/suggest-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          project: project.trim() || null,
          customer_name: customerName.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        urun?: string | null;
        platform?: string | null;
        is_sureci?: string | null;
        islem_tipi?: string | null;
        etkilenen_nesne?: string | null;
        etki?: string | null;
        confidence?: number;
        reason?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      setOpenValues({
        urun: data.urun ?? null,
        platform: data.platform ?? null,
        is_sureci: data.is_sureci ?? null,
        islem_tipi: data.islem_tipi ?? null,
        etkilenen_nesne: data.etkilenen_nesne ?? null,
        etki: data.etki ?? null,
      });
      const conf = data.confidence != null ? `${Math.round(data.confidence * 100)}%` : "—";
      setSuggestInfo(`AI önerisi yüklendi (güven: ${conf}). ${data.reason ?? ""}`);
    } catch (err) {
      setError("Öneri başarısız: " + (err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function submit(mode: "analyze" | "quick") {
    if (description.trim().length < 5) {
      setError("Sorun açıklaması en az 5 karakter olmalı.");
      return;
    }
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/cc-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          customer_name: customerName.trim() || undefined,
          customer_phone: customerPhone.trim() || undefined,
          customer_email: customerEmail.trim() || undefined,
          project: project.trim() || undefined,
          channel,
          mode,
          // Manuel açılış seçimleri — null'lar AI'ye düşer
          open_urun: openValues.urun,
          open_platform: openValues.platform,
          open_is_sureci: openValues.is_sureci,
          open_islem_tipi: openValues.islem_tipi,
          open_etkilenen_nesne: openValues.etkilenen_nesne,
          open_etki: openValues.etki,
        }),
      });
      const data = (await res.json()) as {
        ticket?: Ticket;
        error?: string;
        warnings?: {
          categorize?: string | null;
          analyze?: string | null;
        };
      };
      if (!res.ok || !data.ticket) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      // Backend uyarısı varsa session storage'a yaz → detay sayfası gösterecek
      if (data.warnings) {
        const w = [
          data.warnings.categorize
            ? `Kategorizasyon başarısız: ${data.warnings.categorize}`
            : null,
          data.warnings.analyze
            ? `AI analizi başarısız: ${data.warnings.analyze}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        if (w) {
          sessionStorage.setItem(`cc-warn-${data.ticket.id}`, w);
        }
      }
      router.push(`/support/cc/${data.ticket.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/support/cc">
          <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={14} />}>
            Geri
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Ticket</h1>
      </div>

      <Card padding="lg">
        <CardHeader>Müşteri Bilgisi</CardHeader>
        <CardTitle className="mb-4">Çağrı detayları</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Ad / Firma">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={!!busy}
              placeholder="Örn. Nestle Türkiye"
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            />
          </Field>
          <Field label="Proje">
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              disabled={!!busy}
              placeholder="Örn. NESTLE"
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            />
          </Field>
          <Field label="Telefon">
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={!!busy}
              placeholder="Opsiyonel"
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            />
          </Field>
          <Field label="E-posta">
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              disabled={!!busy}
              placeholder="Opsiyonel"
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            />
          </Field>
          <Field label="Kanal" className="md:col-span-2">
            <div className="flex gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id)}
                  disabled={!!busy}
                  className={
                    "px-3 h-8 text-xs rounded-md font-medium transition-colors " +
                    (channel === c.id
                      ? "bg-[var(--color-accent-soft)] text-accent"
                      : "text-muted hover:text-fg hover:bg-surface-2 border border-border")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>Sorun</CardHeader>
        <CardTitle className="mb-3">Çağrıdan alınan açıklama</CardTitle>
        <textarea
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!!busy}
          placeholder="Müşterinin yaşadığı sorunu olabildiğince detaylı yazın. Örnek: 'Müşteri faturayı GİB'e gönderemiyor, hata olarak…' "
          rows={8}
          className="w-full text-sm bg-surface border border-border-strong rounded-md p-3 leading-relaxed"
        />
        <p className="text-[11px] text-muted mt-1">
          Sistem bu metni otomatik olarak kategorize edecek (kategori + kök
          neden) ve seçeneğinize göre AI analizini de çalıştıracak.
        </p>
      </Card>

      <Card padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardHeader>Açılış Sınıflandırması</CardHeader>
            <CardTitle className="mb-1">
              Müşteri dilinde — 5 alan
            </CardTitle>
            <p className="text-[11px] text-muted">
              Manuel doldur veya AI önerisi yükle. Boş bıraktığın alanları AI
              ticket açılırken otomatik dolduracak.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Wand2 size={14} />}
            loading={busy === "suggest"}
            disabled={!!busy || description.trim().length < 5}
            onClick={suggestOpen}
          >
            AI ile Önerle
          </Button>
        </div>

        {suggestInfo && (
          <p className="text-[11px] text-accent mt-2 leading-relaxed">
            {suggestInfo}
          </p>
        )}

        <div className="mt-4">
          <OpenForm
            value={openValues}
            onChange={setOpenValues}
            disabled={!!busy}
          />
        </div>
      </Card>

      {error && (
        <Card tone="bad" padding="md">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      <Card padding="lg" tone="accent">
        <CardHeader>Aksiyon</CardHeader>
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <Button
            variant="primary"
            size="lg"
            loading={busy === "analyze"}
            disabled={!!busy || description.trim().length < 5}
            iconLeft={<Sparkles size={16} />}
            onClick={() => submit("analyze")}
            className="flex-1"
          >
            Analiz Et ve Aç
          </Button>
          <Button
            variant="secondary"
            size="lg"
            loading={busy === "quick"}
            disabled={!!busy || description.trim().length < 5}
            iconLeft={<FilePlus size={16} />}
            onClick={() => submit("quick")}
            className="flex-1"
          >
            Hızlı Kayıt
          </Button>
        </div>
        <p className="text-[11px] text-muted mt-3">
          <strong>Analiz Et ve Aç:</strong> AI hemen çalışır (~15-20s), çözüm
          önerileri ile ticket açılır. <strong>Hızlı Kayıt:</strong> Ticket
          anında açılır, AI analizi sonradan detay sayfasından
          tetiklenebilir.
        </p>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
