import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  loadAllScreens,
  searchScreens,
  type PanoramaScreen,
} from "@/lib/ticket/panorama-docs";

export const dynamic = "force-dynamic";

type Search = Promise<{ q?: string; modul?: string }>;

export default async function GuidesIndexPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const modulFilter = (sp.modul ?? "").trim();

  const all = loadAllScreens();
  // Modül başına grupla
  const byModule = new Map<string, PanoramaScreen[]>();
  for (const s of all) {
    const m = s.modulePath[0] ?? "(diğer)";
    const arr = byModule.get(m) ?? [];
    arr.push(s);
    byModule.set(m, arr);
  }
  const modules = Array.from(byModule.entries())
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => b.items.length - a.items.length);

  // Arama veya filtre uygulanmışsa düz listeye dön
  let flatResults: PanoramaScreen[] | null = null;
  if (q) {
    flatResults = searchScreens(q, { limit: 100 }).map((h) => h.screen);
  } else if (modulFilter) {
    flatResults = byModule.get(modulFilter) ?? [];
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panorama Kılavuzları</h1>
          <p className="text-sm text-muted mt-1">
            Tüm {all.length} ekran kılavuzu — menü adımı, alan/buton açıklamaları
            ve ilişkili ticket örnekleriyle.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="muted">{all.length} kılavuz</Badge>
          <Badge tone="muted">{modules.length} modül</Badge>
        </div>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Kılavuz ara: 'rut tanım', 'iskonto', 'e-arşiv'..."
          className="flex-1 h-10 text-sm bg-surface border border-border-strong rounded-md px-3"
        />
        {modulFilter && <input type="hidden" name="modul" value={modulFilter} />}
        <button
          type="submit"
          className="px-5 h-10 bg-accent text-accent-fg rounded-md text-sm font-medium"
        >
          Ara
        </button>
        {(q || modulFilter) && (
          <Link
            href="/support/guides"
            className="px-3 h-10 flex items-center text-sm text-muted hover:text-fg"
          >
            Temizle
          </Link>
        )}
      </form>

      {flatResults !== null ? (
        <>
          <p className="text-xs text-muted">
            {q ? `"${q}"` : `Modül: ${modulFilter}`} · {flatResults.length} sonuç
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flatResults.map((s) => (
              <li key={s.id}>
                <ScreenCard screen={s} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {modules.map((m) => (
            <Card key={m.name} padding="md">
              <div className="flex items-center justify-between mb-3">
                <CardTitle>{m.name}</CardTitle>
                <Badge tone="accent" size="md">
                  {m.items.length} ekran
                </Badge>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1.5">
                {m.items.slice(0, 12).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/support/guides/${s.id}`}
                      className="text-xs text-fg-2 hover:text-accent hover:underline"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {m.items.length > 12 && (
                <Link
                  href={`/support/guides?modul=${encodeURIComponent(m.name)}`}
                  className="text-xs text-accent hover:underline mt-2 inline-block"
                >
                  Tümünü gör ({m.items.length}) →
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenCard({ screen }: { screen: PanoramaScreen }) {
  return (
    <Link href={`/support/guides/${screen.id}`} className="block">
      <Card padding="md" className="hover:bg-surface-2 transition-colors h-full">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold leading-snug">{screen.title}</p>
          {screen.modulePath[0] && (
            <Badge tone="muted" size="sm">
              {screen.modulePath[0]}
            </Badge>
          )}
        </div>
        {screen.menuStep && (
          <p className="text-[11px] font-mono text-accent mb-1 line-clamp-1">
            {screen.menuStep}
          </p>
        )}
        {screen.summary && (
          <p className="text-xs text-fg-2 leading-relaxed line-clamp-2">
            {screen.summary}
          </p>
        )}
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {screen.fields.length > 0 && (
            <Badge tone="default" size="sm">
              {screen.fields.length} alan
            </Badge>
          )}
          {screen.buttons.length > 0 && (
            <Badge tone="default" size="sm">
              {screen.buttons.length} buton
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
