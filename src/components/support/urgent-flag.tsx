import { Badge } from "@/components/ui/badge";

export function UrgentFlag({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  if (/evet/i.test(value)) {
    return (
      <Badge tone="bad" size="md" dot>
        ACİL
      </Badge>
    );
  }
  return null;
}
