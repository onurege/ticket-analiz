import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type H = { text: string; confidence: number };

export function RootCauseList({ items }: { items: H[] }) {
  return (
    <Card padding="lg">
      <CardHeader>Olası Kök Nedenler</CardHeader>
      <CardTitle className="mb-3">{items.length} hipotez</CardTitle>
      <ol className="flex flex-col gap-2">
        {items.map((h, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-fg-2 border-l-2 border-accent/40 pl-3"
          >
            <span className="text-[10px] font-mono text-muted shrink-0 mt-0.5">
              %{Math.round(h.confidence * 100)}
            </span>
            <span className="leading-relaxed">{h.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
