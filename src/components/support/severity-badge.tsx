import { Badge } from "@/components/ui/badge";

type Props = { value: string | null | undefined };

export function SeverityBadge({ value }: Props) {
  if (!value) return <Badge tone="muted">—</Badge>;
  const v = value.trim();
  if (/kritik/i.test(v)) return <Badge tone="bad" dot>Kritik</Badge>;
  if (/yüksek/i.test(v)) return <Badge tone="warn" dot>Yüksek</Badge>;
  if (/normal/i.test(v)) return <Badge tone="good">Normal</Badge>;
  return <Badge tone="muted">{v}</Badge>;
}
