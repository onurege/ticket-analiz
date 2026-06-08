"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { user?: unknown; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-surface-2">
      <Card padding="lg" className="w-full max-w-sm">
        <div className="text-center mb-5">
          <CardTitle className="text-xl">EnRoute Destek Merkezi</CardTitle>
          <p className="text-xs text-muted mt-1">Çağrı Merkezi giriş</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              E-posta
            </label>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
              Parola
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-xs text-bad bg-[var(--color-bad-soft)] border border-bad/30 rounded-md p-2">
              {error}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={busy || !email || !password}
            iconLeft={<LogIn size={16} />}
            loading={busy}
          >
            Giriş Yap
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
