import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EngineeringHandoffCard({
  summary,
  suggestedBugGroup,
  suggestedTfsTip,
}: {
  summary: string;
  suggestedBugGroup?: string | null;
  suggestedTfsTip?: string | null;
}) {
  return (
    <Card tone="warn" padding="lg">
      <CardHeader>Yazılım Ekibine Teknik Özet</CardHeader>
      <CardTitle className="mb-2">Handoff Taslağı</CardTitle>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {suggestedBugGroup && (
          <Badge tone="warn" size="md">
            BugGroup önerisi: {suggestedBugGroup}
          </Badge>
        )}
        {suggestedTfsTip && (
          <Badge tone="accent" size="md">
            TFS Tip önerisi: {suggestedTfsTip}
          </Badge>
        )}
      </div>
      <p className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap">
        {summary}
      </p>
    </Card>
  );
}
