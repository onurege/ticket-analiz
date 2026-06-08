import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type { PanoramaScreen } from "@/lib/ticket/panorama-docs";

export function PanoramaScreensCard({
  screens,
  emptyMessage = "Bu kategori için kılavuz ekranı eşlenmedi.",
}: {
  screens: PanoramaScreen[];
  emptyMessage?: string;
}) {
  if (screens.length === 0) {
    return (
      <Card padding="md" tone="muted">
        <CardHeader>İlgili Panorama Ekranları</CardHeader>
        <p className="text-sm text-fg-2 mt-1">{emptyMessage}</p>
      </Card>
    );
  }
  return (
    <Card padding="lg">
      <CardHeader>İlgili Panorama Ekranları</CardHeader>
      <CardTitle className="mb-3">
        {screens.length} kullanım kılavuzu
      </CardTitle>
      <ul className="flex flex-col divide-y divide-border -mx-1">
        {screens.map((s) => (
          <li key={s.id}>
            <Link
              href={`/support/guides/${s.id}`}
              className="block px-1 py-3 group hover:bg-surface-2 -mx-1 px-1 rounded-md transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors">
                  {s.title}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {s.modulePath[0] && (
                    <Badge tone="muted" size="sm">
                      {s.modulePath[0]}
                    </Badge>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-muted group-hover:text-accent transition-colors"
                  />
                </div>
              </div>
              {s.menuStep && (
                <p className="text-[11px] font-mono text-accent mb-1">
                  {s.menuStep}
                </p>
              )}
              {s.summary && (
                <p className="text-xs text-fg-2 leading-relaxed line-clamp-2">
                  {s.summary}
                </p>
              )}
              {(s.fields.length > 0 || s.buttons.length > 0) && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {s.fields.length > 0 && (
                    <Badge tone="default" size="sm">
                      {s.fields.length} alan
                    </Badge>
                  )}
                  {s.buttons.length > 0 && (
                    <Badge tone="default" size="sm">
                      {s.buttons.length} buton
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
