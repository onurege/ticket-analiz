import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  loadTaxonomyV2,
  OPEN_FIELD_ORDER,
} from "@/lib/cc/taxonomy-v2";

export const dynamic = "force-dynamic";

/*
 * Kategori Ağacı sayfası — v3 taksonomisini Açılış / Kapanış olarak
 * iki kart halinde gösterir. Excel kaynağındaki "Konum / Grup Adı / İçerik"
 * yapısını birebir yansıtır.
 *
 * Sol kart — Açılış (müşteri dili): 6 alan
 * Sağ kart — Kapanış (destek dili): 3 alan (kök neden 2 seviyeli)
 */

export default function CategoriesPage() {
  const tax = loadTaxonomyV2();
  const open = tax.open;
  const close = tax.close;

  const openCount = OPEN_FIELD_ORDER.reduce(
    (n, f) => n + (open[f]?.values.length ?? 0),
    0,
  );
  const kokNedenDetailCount = close.kok_neden.groups.reduce(
    (n, g) => n + g.details.length,
    0,
  );
  const closeCount =
    close.kok_neden.groups.length +
    kokNedenDetailCount +
    close.cozum_tipi.values.length +
    close.kalici_onlem.values.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Kategori Ağacı
          </h1>
          <p className="text-sm text-muted mt-1">
            <span className="font-mono text-xs">{tax.version}</span> ·{" "}
            {tax.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="muted">Açılış: {openCount} değer</Badge>
          <Badge tone="muted">Kapanış: {closeCount} değer</Badge>
        </div>
      </div>

      <p className="text-[11px] text-muted">
        Kaynak:{" "}
        <code className="font-mono">{tax.source}</code>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Açılış */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2.5 rounded-full bg-accent" />
            <CardHeader>Açılış — Müşteri Dili</CardHeader>
          </div>
          <CardTitle className="mb-1">
            Ticket açılırken seçilir · {OPEN_FIELD_ORDER.length} alan
          </CardTitle>
          <p className="text-[11px] text-muted mb-4">
            "Ne yapmak istiyordunuz?" — müşterinin terimleriyle.
          </p>
          <div className="flex flex-col gap-4">
            {OPEN_FIELD_ORDER.map((f) => {
              const spec = open[f];
              if (!spec) return null;
              return (
                <details
                  key={f}
                  open={spec.values.length <= 12}
                  className="group"
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-surface-2 rounded-md select-none">
                    <span className="text-sm font-semibold">{spec.label}</span>
                    <span className="text-[10px] text-muted font-mono">
                      ({f}) · {spec.values.length} adet
                    </span>
                  </summary>
                  <ul className="mt-1 ml-4 pl-3 border-l border-border space-y-0.5">
                    {spec.values.map((v) => (
                      <li
                        key={v}
                        className="text-xs text-fg-2 py-0.5 hover:text-fg"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </Card>

        {/* Kapanış */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2.5 rounded-full bg-good" />
            <CardHeader>Kapanış — Destek Dili</CardHeader>
          </div>
          <CardTitle className="mb-1">
            Ticket kapatılırken doldurulur · 3 alan
          </CardTitle>
          <p className="text-[11px] text-muted mb-4">
            "Gerçek sebep ne çıktı?" — destek personelince.
          </p>

          <div className="flex flex-col gap-4">
            {/* Kök Neden — iki seviyeli */}
            <details open className="group">
              <summary className="cursor-pointer flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-surface-2 rounded-md select-none">
                <span className="text-sm font-semibold">
                  {close.kok_neden.label}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {close.kok_neden.groups.length} grup · {kokNedenDetailCount}{" "}
                  detay
                </span>
              </summary>
              <ul className="mt-1 ml-2 space-y-1">
                {close.kok_neden.groups.map((g) => (
                  <li key={g.group}>
                    <details>
                      <summary className="cursor-pointer flex items-center justify-between gap-2 py-1 px-2 hover:bg-surface-2 rounded-md select-none">
                        <span className="text-xs font-medium">
                          {g.group}
                        </span>
                        <span className="text-[10px] text-muted">
                          {g.details.length} detay
                        </span>
                      </summary>
                      <ul className="mt-1 ml-4 pl-3 border-l border-border space-y-0.5">
                        {g.details.map((d) => (
                          <li
                            key={d}
                            className="text-xs text-fg-2 py-0.5"
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </details>

            {/* Çözüm Tipi */}
            <details open className="group">
              <summary className="cursor-pointer flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-surface-2 rounded-md select-none">
                <span className="text-sm font-semibold">
                  {close.cozum_tipi.label}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {close.cozum_tipi.values.length} adet
                </span>
              </summary>
              <ul className="mt-1 ml-4 pl-3 border-l border-border space-y-0.5">
                {close.cozum_tipi.values.map((v) => (
                  <li
                    key={v}
                    className="text-xs text-fg-2 py-0.5"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </details>

            {/* Kalıcı Önlem */}
            <details open className="group">
              <summary className="cursor-pointer flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-surface-2 rounded-md select-none">
                <span className="text-sm font-semibold">
                  {close.kalici_onlem.label}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {close.kalici_onlem.values.length} adet · opsiyonel
                </span>
              </summary>
              <ul className="mt-1 ml-4 pl-3 border-l border-border space-y-0.5">
                {close.kalici_onlem.values.map((v) => (
                  <li
                    key={v}
                    className="text-xs text-fg-2 py-0.5"
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </Card>
      </div>
    </div>
  );
}
