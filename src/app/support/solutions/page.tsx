import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSolutions, searchSolutions } from "@/lib/ticket/solutions";
import { loadAllScreens } from "@/lib/ticket/panorama-docs";

/**
 * `panorama-<screen_id>` solution ID'lerinin gerçek screen ID'sini
 * solutions seed'i lowercase yapıyor; lookup'ı case-insensitive yap.
 */
function panoramaScreenIdFor(solutionId: string): string | null {
  if (!solutionId.startsWith("panorama-")) return null;
  const wanted = solutionId.slice("panorama-".length);
  for (const s of loadAllScreens()) {
    if (s.id.toLowerCase() === wanted) return s.id;
  }
  return null;
}

export const dynamic = "force-dynamic";

type Search = Promise<{ q?: string }>;

export default async function SolutionsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const results = q ? searchSolutions(q, 50) : listSolutions().slice(0, 50);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Çözüm Bankası</h1>
          <p className="text-sm text-muted mt-1">
            Yerli çözüm kayıtları. Yazılım ekibi ya da kıdemli destek bu bankaya
            kayıt ekler; destek temsilcileri analiz panelinden erişir.
          </p>
        </div>
        <Badge tone="muted">{results.length} kayıt</Badge>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Anahtar kelime ile ara (örn. 'rut tanımı')"
          className="flex-1 h-10 text-sm bg-surface border border-border-strong rounded-md px-3"
        />
        <button
          type="submit"
          className="px-5 h-10 bg-accent text-accent-fg rounded-md text-sm font-medium"
        >
          Ara
        </button>
      </form>

      {results.length === 0 && (
        <Card padding="lg" tone="muted">
          <CardHeader>Henüz boş</CardHeader>
          <CardTitle>Çözüm bankası kayıt içermiyor</CardTitle>
          <p className="text-sm text-fg-2 mt-2">
            <code className="font-mono text-xs">
              POST /api/solutions/search
            </code>{" "}
            endpoint'i ile veya manuel olarak{" "}
            <code className="font-mono text-xs">data/solutions/&lt;id&gt;/</code>{" "}
            altında <code className="font-mono text-xs">meta.json</code> +{" "}
            <code className="font-mono text-xs">solution.md</code> oluşturarak
            kayıt ekleyebilirsin.
          </p>
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {results.map((s) => {
          const screenId = panoramaScreenIdFor(s.id);
          const inner = (
            <Card padding="md" className={screenId ? "hover:bg-surface-2 transition-colors" : ""}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                <span className="text-[10px] font-mono text-muted">{s.id}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {s.tags.map((t) => (
                  <Badge key={t} tone="default" size="sm">
                    {t}
                  </Badge>
                ))}
                {s.categories.map((c) => (
                  <Badge key={c} tone="accent" size="sm">
                    {c}
                  </Badge>
                ))}
                {s.severity && (
                  <Badge tone="warn" size="sm">
                    {s.severity}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted">
                Oluşturuldu: {s.createdAt.slice(0, 10)}
              </p>
            </Card>
          );
          return (
            <li key={s.id}>
              {screenId ? (
                <Link href={`/support/guides/${screenId}`}>{inner}</Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
