"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportTopicsButton() {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      // Tarayıcıya doğrudan indirt — anchor click'iyle daha güvenilir
      const a = document.createElement("a");
      a.href = "/api/topics/export";
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Sunucu yanıtı gelmesi için kısa bekleme (UX feedback için)
      setTimeout(() => setBusy(false), 800);
    } catch {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      iconLeft={<Download size={14} />}
      loading={busy}
      onClick={handle}
    >
      Excel olarak indir
    </Button>
  );
}
