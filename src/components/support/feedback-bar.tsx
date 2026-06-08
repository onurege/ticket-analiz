"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Wrench } from "lucide-react";

type Verdict = "solved" | "not_solved" | "escalate_engineering";

export function FeedbackBar({ analysisId }: { analysisId: string }) {
  const [sent, setSent] = useState<Verdict | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(verdict: Verdict) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/solutions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, verdict, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setSent(verdict);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Card
        tone={
          sent === "solved" ? "good" : sent === "escalate_engineering" ? "warn" : "muted"
        }
        padding="md"
      >
        <p className="text-sm text-fg-2">
          ✓ Geri bildirim alındı:{" "}
          <strong>
            {sent === "solved"
              ? "Çözdü"
              : sent === "not_solved"
                ? "Çözmedi"
                : "Yazılıma aktarıldı"}
          </strong>
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex flex-col gap-2">
        <textarea
          placeholder="Opsiyonel not: nasıl çözüldü, neyi denedin?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full text-sm bg-surface-2 border border-border rounded-md p-2 min-h-[60px]"
        />
        {error && <p className="text-xs text-bad">Hata: {error}</p>}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Check size={14} />}
            loading={busy}
            onClick={() => send("solved")}
          >
            Çözdü
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconLeft={<X size={14} />}
            loading={busy}
            onClick={() => send("not_solved")}
          >
            Çözmedi
          </Button>
          <Button
            variant="destructive"
            size="sm"
            iconLeft={<Wrench size={14} />}
            loading={busy}
            onClick={() => send("escalate_engineering")}
          >
            Yazılıma Aktar
          </Button>
        </div>
      </div>
    </Card>
  );
}
