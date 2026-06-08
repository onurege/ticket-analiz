import { Badge } from "@/components/ui/badge";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Açık",
  in_progress: "İşlemde",
  escalated: "L2'ye Devr",
  resolved: "Çözüldü",
  closed: "Kapalı",
};

const STATUS_TONES: Record<
  TicketStatus,
  "default" | "accent" | "warn" | "good" | "bad" | "muted"
> = {
  open: "warn",
  in_progress: "accent",
  escalated: "bad",
  resolved: "good",
  closed: "muted",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} size="sm">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export type Role = "super_admin" | "L1_agent" | "L1_lead" | "L2_agent" | "L2_lead";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Süper Admin",
  L1_agent: "L1 Agent",
  L1_lead: "L1 Lead",
  L2_agent: "L2 Agent",
  L2_lead: "L2 Lead",
};

export function RoleBadge({ role }: { role: Role }) {
  const tones: Record<Role, "default" | "accent" | "warn" | "good"> = {
    super_admin: "warn",
    L1_agent: "default",
    L1_lead: "accent",
    L2_agent: "good",
    L2_lead: "accent",
  };
  return (
    <Badge tone={tones[role]} size="sm">
      {ROLE_LABELS[role]}
    </Badge>
  );
}
