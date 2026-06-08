"use client";

import { useEffect, useState } from "react";

/*
 * Açılış sınıflandırması formu — 5 alanlı dropdown grubu.
 *
 * Müşteri dilinde ticket açılışını sınıflandırır:
 *   urun, is_sureci, islem_tipi, etkilenen_nesne, etki
 *
 * Hepsi opsiyonel — boş bırakılırsa backend categorizer-v2 ile AI ile
 * doldurmaya çalışır. Manuel doldurulursa AI'yi bypass eder.
 *
 * "AI önerisi yükle" butonu açıklama metnini /api/cc-tickets/suggest-open
 * endpoint'ine yollayıp dropdown'ları doldurur — ajan kontrol edip
 * gönderir.
 */

export type OpenFormValues = {
  urun: string | null;
  platform: string | null;
  is_sureci: string | null;
  islem_tipi: string | null;
  etkilenen_nesne: string | null;
  etki: string | null;
};

export const EMPTY_OPEN_VALUES: OpenFormValues = {
  urun: null,
  platform: null,
  is_sureci: null,
  islem_tipi: null,
  etkilenen_nesne: null,
  etki: null,
};

type Taxonomy = {
  open: {
    urun: { label: string; values: string[] };
    platform: { label: string; values: string[] };
    is_sureci: { label: string; values: string[] };
    islem_tipi: { label: string; values: string[] };
    etkilenen_nesne: { label: string; values: string[] };
    etki: { label: string; values: string[] };
  };
};

export function OpenForm({
  value,
  onChange,
  disabled,
}: {
  value: OpenFormValues;
  onChange: (next: OpenFormValues) => void;
  disabled?: boolean;
}) {
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  type Field = keyof OpenFormValues;
  const fields: Array<{ key: Field; label: string; values: string[] }> = [
    { key: "urun", label: tax.open.urun.label, values: tax.open.urun.values },
    {
      key: "platform",
      label: tax.open.platform.label,
      values: tax.open.platform.values,
    },
    {
      key: "is_sureci",
      label: tax.open.is_sureci.label,
      values: tax.open.is_sureci.values,
    },
    {
      key: "islem_tipi",
      label: tax.open.islem_tipi.label,
      values: tax.open.islem_tipi.values,
    },
    {
      key: "etkilenen_nesne",
      label: tax.open.etkilenen_nesne.label,
      values: tax.open.etkilenen_nesne.values,
    },
    {
      key: "etki",
      label: tax.open.etki.label,
      values: tax.open.etki.values,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            {f.label}
          </span>
          <select
            disabled={disabled}
            value={value[f.key] ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                [f.key]: e.target.value || null,
              })
            }
            className="w-full h-9 text-sm bg-surface border border-border rounded-md px-2"
          >
            <option value="">— AI doldursun —</option>
            {f.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
