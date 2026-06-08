"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

type Step = { step: string; rationale?: string | null };

export function SuggestedSteps({ steps }: { steps: Step[] }) {
  return (
    <Card padding="lg">
      <CardHeader>Önerilen Çözüm Adımları</CardHeader>
      <CardTitle className="mb-3">{steps.length} adım</CardTitle>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="size-6 rounded-full bg-[var(--color-accent-soft)] text-accent text-xs font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-fg leading-relaxed">{s.step}</p>
                <CopyBtn text={s.step} />
              </div>
              {s.rationale && (
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {s.rationale}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      iconLeft={done ? <Check size={12} /> : <Copy size={12} />}
    >
      {done ? "Kopyalandı" : "Kopyala"}
    </Button>
  );
}
