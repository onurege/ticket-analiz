import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getScreen, loadCategoryMapping } from "@/lib/ticket/panorama-docs";
import { loadBundle } from "@/lib/ticket/recategorizer";
import { getDb } from "@/lib/ticket/local-store";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function encodeKey(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const screen = getScreen(id);
  if (!screen) notFound();

  // Bu kılavuz hangi kategorilere eşlenmiş?
  const mapping = loadCategoryMapping();
  const linkedCategories = Object.entries(mapping)
    .filter(([, ids]) => ids.includes(id))
    .map(([catId]) => catId);

  // Kategorilerin ticket sayıları + kategori adları
  const bundle = loadBundle();
  const categoryInfo = linkedCategories
    .map((catId) => {
      const cat = bundle?.categories.find((c) => c.id === catId);
      const count = bundle?.assignments.filter((a) => a.category_id === catId).length ?? 0;
      return cat ? { id: catId, title: cat.title, count } : null;
    })
    .filter((c): c is { id: string; title: string; count: number } => c !== null);

  // Bu kategorilerdeki son N ticket — destekçi gerçek vaka örnekleri görsün
  type SampleRow = {
    bildirim_no: number;
    bildirim_tarihi: string | null;
    proje: string | null;
    oncelik: string | null;
    aciklama: string | null;
    category_id: string;
  };
  let sampleTickets: SampleRow[] = [];
  if (bundle && linkedCategories.length > 0) {
    const allIds = bundle.assignments
      .filter((a) => linkedCategories.includes(a.category_id))
      .map((a) => a.bildirim_no);
    if (allIds.length > 0) {
      const placeholders = allIds.map(() => "?").join(",");
      const rows = getDb()
        .prepare(
          `SELECT bildirim_no, bildirim_tarihi, proje, oncelik, aciklama
           FROM tickets
           WHERE bildirim_no IN (${placeholders})
             AND aciklama IS NOT NULL
             AND LENGTH(aciklama) > 30
           ORDER BY bildirim_tarihi DESC, bildirim_no DESC
           LIMIT 10`,
        )
        .all(...allIds) as Array<Omit<SampleRow, "category_id">>;
      const idToCat = new Map(
        bundle.assignments.map((a) => [a.bildirim_no, a.category_id]),
      );
      sampleTickets = rows.map((r) => ({
        ...r,
        category_id: idToCat.get(r.bildirim_no) ?? "",
      }));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted mb-1">
          {screen.breadcrumb.length > 0 ? (
            screen.breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">›</span>}
                {b}
              </span>
            ))
          ) : (
            "—"
          )}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{screen.title}</h1>
        {screen.menuStep && (
          <div className="mt-3">
            <Badge tone="accent" size="md" className="font-mono">
              {screen.menuStep}
            </Badge>
          </div>
        )}
      </div>

      {screen.summary && (
        <Card padding="lg" tone="accent">
          <CardHeader>Ekran Tanımı</CardHeader>
          <p className="text-sm text-fg leading-relaxed mt-1 whitespace-pre-wrap">
            {screen.summary}
          </p>
        </Card>
      )}

      {/* İki kolon: Alanlar | Butonlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {screen.fields.length > 0 && (
          <Card padding="lg">
            <CardHeader>Alanlar</CardHeader>
            <CardTitle className="mb-3">{screen.fields.length} alan</CardTitle>
            <ul className="flex flex-col divide-y divide-border -mx-1">
              {screen.fields.map((f, i) => (
                <li key={i} className="px-1 py-2.5">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-fg-2 leading-relaxed mt-0.5">
                    {f.description}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {screen.buttons.length > 0 && (
          <Card padding="lg" tone="muted">
            <CardHeader>Butonlar</CardHeader>
            <CardTitle className="mb-3">{screen.buttons.length} buton</CardTitle>
            <ul className="flex flex-col divide-y divide-border -mx-1">
              {screen.buttons.map((b, i) => (
                <li key={i} className="px-1 py-2.5">
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-fg-2 leading-relaxed mt-0.5">
                    {b.description}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Bu kılavuz hangi kategorilerle ilişkili */}
      {categoryInfo.length > 0 && (
        <Card padding="lg">
          <CardHeader>İlişkili Ticket Kategorileri</CardHeader>
          <CardTitle className="mb-3">
            Bu ekran {categoryInfo.length} kategoriye eşli
          </CardTitle>
          <ul className="flex flex-col gap-2">
            {categoryInfo.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/support/topics/${c.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-md transition-colors"
                >
                  <span className="text-sm font-medium">{c.title}</span>
                  <Badge tone="muted" size="sm">
                    {c.count} ticket
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Gerçek vaka örnekleri */}
      {sampleTickets.length > 0 && (
        <Card padding="lg">
          <CardHeader>Bu Konuda Açılmış Gerçek Bildirimler</CardHeader>
          <CardTitle className="mb-3">{sampleTickets.length} örnek</CardTitle>
          <ul className="flex flex-col divide-y divide-border -mx-1">
            {sampleTickets.map((t) => (
              <li key={t.bildirim_no} className="px-1 py-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm">#{t.bildirim_no}</span>
                  <span className="text-[11px] text-muted">
                    {t.bildirim_tarihi?.slice(0, 10) ?? "—"}
                  </span>
                  {t.oncelik && (
                    <Badge
                      tone={
                        t.oncelik === "Kritik"
                          ? "bad"
                          : t.oncelik === "Yüksek"
                            ? "warn"
                            : "muted"
                      }
                      size="sm"
                    >
                      {t.oncelik}
                    </Badge>
                  )}
                  {t.proje && (
                    <Badge tone="default" size="sm">
                      {t.proje}
                    </Badge>
                  )}
                </div>
                {t.aciklama && (
                  <p className="text-xs text-fg-2 leading-relaxed line-clamp-3">
                    {t.aciklama}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Modül yolu navigasyonu */}
      {screen.modulePath.length > 0 && (
        <Card padding="md" tone="muted">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-1">
            Modül Yolu
          </p>
          <p className="text-sm text-fg-2">
            {screen.modulePath.join(" › ")}
          </p>
        </Card>
      )}

      <p className="text-[10px] text-muted text-right">
        Kılavuz ID: <span className="font-mono">{screen.id}</span>
        {" · "}Kaynak: Panorama Kullanım Kılavuzu
      </p>

      <div className="text-xs text-muted">
        {linkedCategories[0] && (
          <Link
            href={`/support/topics/${linkedCategories[0]}`}
            className="text-accent hover:underline"
          >
            ← İlişkili kategoriye dön
          </Link>
        )}
      </div>
    </div>
  );
}
