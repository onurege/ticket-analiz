"use client";

import { useEffect, useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/*
 * Ticket kapatma formu — yeni v2 sınıflandırması.
 *
 * Kapatmadan ÖNCE doldurulması zorunlu alanlar:
 *   - Kök Neden Grubu (12 grup)
 *   - Kök Neden Detayı (grup'a göre cascade)
 *   - Çözüm Tipi (12 seçenek)
 *
 * Opsiyonel:
 *   - Kalıcı Önlem (8 seçenek)
 *
 * Taksonomi /api/cc-taxonomy üzerinden client-side fetch ile alınır,
 * 1 saat cache. Tüm seçimler strict — backend de doğrulama yapar.
 */

type RootCauseGroup = {
  group: string;
  details: string[];
};

type Taxonomy = {
  close: {
    kok_neden: { groups: RootCauseGroup[] };
    cozum_tipi: { values: string[] };
    kalici_onlem: { values: string[] };
  };
};

export type CloseFormValues = {
  close_kok_neden_grubu: string;
  close_kok_neden_detayi: string;
  close_cozum_tipi: string;
  close_kalici_onlem: string | null;
};

export function CloseForm({
  value,
  onChange,
  disabled,
  ticketId,
  resolution,
}: {
  value: CloseFormValues;
  onChange: (next: CloseFormValues) => void;
  disabled?: boolean;
  // AI öneri butonu için — ikisi de verilirse buton görünür
  ticketId?: number;
  resolution?: string;
}) {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestInfo, setSuggestInfo] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  async function aiSuggest(): Promise<void> {
    if (!ticketId || !resolution || resolution.trim().length < 5) {
      setSuggestError("Önce çözüm taslağını yazın (en az 5 karakter).");
      return;
    }
    setSuggesting(true);
    setSuggestError(null);
    setSuggestInfo(null);
    try {
      const res = await fetch(`/api/cc-tickets/${ticketId}/suggest-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = (await res.json()) as {
        kok_neden_grubu?: string | null;
        kok_neden_detayi?: string | null;
        cozum_tipi?: string | null;
        kalici_onlem?: string | null;
        confidence?: number;
        reason?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      onChange({
        close_kok_neden_grubu: data.kok_neden_grubu ?? "",
        close_kok_neden_detayi: data.kok_neden_detayi ?? "",
        close_cozum_tipi: data.cozum_tipi ?? "",
        close_kalici_onlem: data.kalici_onlem ?? null,
      });
      const conf =
        data.confidence != null
          ? `${Math.round(data.confidence * 100)}%`
          : "—";
      setSuggestInfo(
        `AI önerisi yüklendi (güven: ${conf}). ${data.reason ?? ""}`,
      );
    } catch (err) {
      setSuggestError((err as Error).message);
    } finally {
      setSuggesting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cc-taxonomy")
      .then((r) => r.json())
      .then((data: Taxonomy) => {
        if (!cancelled) setTax(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <p className="text-xs text-bad">Taksonomi yüklenemedi: {loadError}</p>
    );
  }
  if (!tax) {
    return <p className="text-xs text-muted">Sınıflandırma şeması yükleniyor…</p>;
  }

  const groupObj = tax.close.kok_neden.groups.find(
    (g) => g.group === value.close_kok_neden_grubu,
  );

  const showSuggestButton = ticketId != null && resolution != null;

  return (
    <>
      {showSuggestButton && (
        <div className="flex items-center justify-between gap-3 mt-3 mb-2">
          <div className="flex-1 min-w-0">
            {suggestInfo && (
              <p className="text-[11px] text-accent leading-relaxed">
                {suggestInfo}
              </p>
            )}
            {suggestError && (
              <p className="text-[11px] text-bad leading-relaxed">
                Öneri: {suggestError}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Wand2 size={14} />}
            loading={suggesting}
            disabled={disabled || !resolution || resolution.trim().length < 5}
            onClick={aiSuggest}
          >
            AI ile Önerle
          </Button>
        </div>
      )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      <Field label="Kök Neden Grubu" required>
        <select
          disabled={disabled}
          value={value.close_kok_neden_grubu}
          onChange={(e) =>
            onChange({
              ...value,
              close_kok_neden_grubu: e.target.value,
              // Grup değişti → detay sıfırla
              close_kok_neden_detayi: "",
            })
          }
          className="w-full h-9 text-sm bg-surface border border-border rounded-md px-2"
        >
          <option value="">— seçin —</option>
          {tax.close.kok_neden.groups.map((g) => (
            <option key={g.group} value={g.group}>
              {g.group}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kök Neden Detayı" required>
        <select
          disabled={disabled || !groupObj}
          value={value.close_kok_neden_detayi}
          onChange={(e) =>
            onChange({ ...value, close_kok_neden_detayi: e.target.value })
          }
          className="w-full h-9 text-sm bg-surface border border-border rounded-md px-2 disabled:opacity-50"
        >
          <option value="">
            {groupObj ? "— seçin —" : "Önce grup seçin"}
          </option>
          {groupObj?.details.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Çözüm Tipi" required>
        <select
          disabled={disabled}
          value={value.close_cozum_tipi}
          onChange={(e) =>
            onChange({ ...value, close_cozum_tipi: e.target.value })
          }
          className="w-full h-9 text-sm bg-surface border border-border rounded-md px-2"
        >
          <option value="">— seçin —</option>
          {tax.close.cozum_tipi.values.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Kalıcı Önlem" hint="opsiyonel">
        <select
          disabled={disabled}
          value={value.close_kalici_onlem ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              close_kalici_onlem: e.target.value || null,
            })
          }
          className="w-full h-9 text-sm bg-surface border border-border rounded-md px-2"
        >
          <option value="">— yok / sonra —</option>
          {tax.close.kalici_onlem.values.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    </div>
    </>
  );
}

export function isCloseFormValid(v: CloseFormValues): boolean {
  return (
    v.close_kok_neden_grubu.length > 0 &&
    v.close_kok_neden_detayi.length > 0 &&
    v.close_cozum_tipi.length > 0
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-muted flex items-center gap-1">
        {label}
        {required && <span className="text-bad">*</span>}
        {hint && <span className="text-muted/70 normal-case">({hint})</span>}
      </span>
      {children}
    </label>
  );
}
