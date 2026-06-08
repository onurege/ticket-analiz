"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/components/ui/cn";

type Mode = "bildirimNo" | "freeText";

export type AnalyzeBodyPayload = {
  bildirimNo?: number;
  freeText?: string;
  project?: string;
};

export function TicketInput({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (body: AnalyzeBodyPayload) => void;
}) {
  const [mode, setMode] = useState<Mode>("bildirimNo");
  const [bildirimNo, setBildirimNo] = useState("");
  const [freeText, setFreeText] = useState("");
  const [project, setProject] = useState("");

  function handle() {
    if (mode === "bildirimNo") {
      const n = Number(bildirimNo);
      if (!Number.isInteger(n) || n <= 0) return;
      onSubmit({ bildirimNo: n, project: project.trim() || undefined });
    } else {
      const t = freeText.trim();
      if (t.length < 5) return;
      onSubmit({ freeText: t, project: project.trim() || undefined });
    }
  }

  return (
    <Card padding="lg">
      <div className="flex items-center gap-1 mb-3">
        <TabButton active={mode === "bildirimNo"} onClick={() => setMode("bildirimNo")}>
          Bildirim No
        </TabButton>
        <TabButton active={mode === "freeText"} onClick={() => setMode("freeText")}>
          Sorun Metni
        </TabButton>
      </div>

      {mode === "bildirimNo" ? (
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          placeholder="örn. 32511772"
          value={bildirimNo}
          onChange={(e) => setBildirimNo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && handle()}
          className="w-full h-11 text-base font-mono bg-surface border border-border-strong rounded-md px-3 mb-3"
        />
      ) : (
        <textarea
          autoFocus
          placeholder="Müşteri ne yazıyor? Sorunu kısaca anlat..."
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          className="w-full text-sm bg-surface border border-border-strong rounded-md p-3 min-h-[140px] mb-3 leading-relaxed"
        />
      )}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Proje (opsiyonel) — örn. SUZUKI"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="flex-1 h-9 text-sm bg-surface border border-border rounded-md px-3"
        />
        <Button
          variant="primary"
          size="lg"
          iconLeft={<Search size={16} />}
          loading={busy}
          onClick={handle}
        >
          Analiz Et
        </Button>
      </div>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 h-8 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-accent-soft)] text-accent"
          : "text-muted hover:text-fg hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
