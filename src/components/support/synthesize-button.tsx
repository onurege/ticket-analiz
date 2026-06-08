"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles, RotateCcw } from "lucide-react";
import { SynthesisPanel, type SynthesisResult } from "./synthesis-panel";

type Props = {
  groupBy: string;
  groupKey: string;
  initialResult: SynthesisResult | null;
};

export function SynthesizeButton({ groupBy, groupKey, initialResult }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SynthesisResult | null>(initialResult);
  const [error, setError] = useState<string | null>(null);

  async function run(force: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupBy, groupKey, force }),
      });
      const data = (await res.json()) as SynthesisResult | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `API ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {!result && (
          <Button
            variant="primary"
            size="lg"
            iconLeft={<Sparkles size={16} />}
            loading={busy}
            onClick={() => run(false)}
          >
            Sentez Üret
          </Button>
        )}
        {result && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RotateCcw size={14} />}
            loading={busy}
            onClick={() => run(true)}
          >
            Yeniden Üret
          </Button>
        )}
      </div>

      {busy && !result && (
        <Card padding="lg" tone="muted">
          <div className="flex items-center gap-3 text-sm text-fg-2">
            <Spinner size={18} />
            Sentez üretiliyor… kayıtlar deterministik olarak birleştiriliyor.
          </div>
        </Card>
      )}

      {error && (
        <Card padding="lg" tone="bad">
          <p className="text-sm">
            <strong>Hata: </strong>
            {error}
          </p>
        </Card>
      )}

      {result && <SynthesisPanel result={result} />}
    </div>
  );
}
