"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CustomerReplyCard({ draft }: { draft: string }) {
  const [copied, setCopied] = useState(false);
  const [editable, setEditable] = useState(false);
  const [text, setText] = useState(draft);

  return (
    <Card tone="good" padding="lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <CardHeader>Müşteri Yanıtı (Taslak)</CardHeader>
          <CardTitle>Düzenle / Kopyala</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={copied ? <Check size={12} /> : <Copy size={12} />}
          onClick={() => {
            navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      {editable ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[140px] text-sm leading-relaxed bg-surface border border-border rounded-md p-3"
        />
      ) : (
        <p
          className="text-sm text-fg-2 leading-relaxed whitespace-pre-wrap cursor-text"
          onClick={() => setEditable(true)}
        >
          {text}
        </p>
      )}
    </Card>
  );
}
