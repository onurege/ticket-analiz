"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Key, UserX, Save, X } from "lucide-react";

type Role = "super_admin" | "L1_agent" | "L1_lead" | "L2_agent" | "L2_lead";

type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
};

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Süper Admin",
  L1_agent: "L1 Agent (ÇM)",
  L1_lead: "L1 Team Lead",
  L2_agent: "L2 Agent (Yazılım)",
  L2_lead: "L2 Team Lead",
};

const ROLE_TONES: Record<Role, "accent" | "warn" | "good" | "default" | "muted"> = {
  super_admin: "warn",
  L1_agent: "default",
  L1_lead: "accent",
  L2_agent: "good",
  L2_lead: "accent",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setError(
          "Bu sayfa sadece Süper Admin için. Mevcut rolünüz yeterli değil.",
        );
        setUsers([]);
        return;
      }
      const data = (await res.json()) as { users?: User[]; error?: string };
      if (!res.ok) throw new Error(data.error || `Hata ${res.status}`);
      setUsers(data.users ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-muted mt-1">
            Sistem kullanıcılarını yönetin (oluştur, rol değiştir, parola
            sıfırla, devre dışı bırak).
          </p>
        </div>
        <Button
          variant="primary"
          iconLeft={<UserPlus size={14} />}
          onClick={() => setCreateOpen(true)}
        >
          Yeni Kullanıcı
        </Button>
      </div>

      {loading && (
        <Card tone="muted" padding="lg">
          <p className="text-sm text-muted">Yükleniyor…</p>
        </Card>
      )}

      {error && (
        <Card tone="bad" padding="lg">
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {users && users.length > 0 && (
        <Card padding="none">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th className="text-left p-3">Ad</th>
                <th className="text-left p-3">E-posta</th>
                <th className="text-left p-3">Rol</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-fg-2 font-mono text-xs">{u.email}</td>
                  <td className="p-3">
                    <Badge tone={ROLE_TONES[u.role]} size="sm">
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {u.active === 1 ? (
                      <Badge tone="good" size="sm">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge tone="muted" size="sm">
                        Pasif
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(u)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Key size={12} />}
                        onClick={() => setResetting(u)}
                      >
                        Parola
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {createOpen && (
        <CreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}
      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {resetting && (
        <ResetPasswordModal
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => setResetting(null)}
        />
      )}
    </div>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{title}</CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}

const ROLE_OPTIONS: Role[] = [
  "L1_agent",
  "L1_lead",
  "L2_agent",
  "L2_lead",
  "super_admin",
];

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("L1_agent");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, password }),
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Yeni Kullanıcı" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FormField label="Ad Soyad">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          />
        </FormField>
        <FormField label="E-posta">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          />
        </FormField>
        <FormField label="Rol">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Başlangıç Parolası (en az 8 karakter)">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            autoComplete="new-password"
          />
        </FormField>
        {error && (
          <p className="text-xs text-bad bg-[var(--color-bad-soft)] border border-bad/30 rounded-md p-2">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Vazgeç
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={busy}
            iconLeft={<Save size={14} />}
          >
            Oluştur
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState<number>(user.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, active: active === 1 }),
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!confirm("Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title={`Kullanıcı Düzenle — ${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FormField label="Ad Soyad">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          />
        </FormField>
        <FormField label="Rol">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Durum">
          <select
            value={active}
            onChange={(e) => setActive(Number(e.target.value))}
            disabled={busy}
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
          >
            <option value={1}>Aktif</option>
            <option value={0}>Pasif</option>
          </select>
        </FormField>
        {error && (
          <p className="text-xs text-bad bg-[var(--color-bad-soft)] border border-bad/30 rounded-md p-2">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-between mt-1">
          <Button
            variant="destructive"
            size="sm"
            type="button"
            onClick={deactivate}
            disabled={busy}
            iconLeft={<UserX size={14} />}
          >
            Devre Dışı Bırak
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={busy}
              iconLeft={<Save size={14} />}
            >
              Kaydet
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onDone,
}: {
  user: User;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || `Hata ${res.status}`);
      }
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <ModalShell title="Parola Sıfırlandı" onClose={onClose}>
        <p className="text-sm text-good">
          Yeni parola ayarlandı. Kullanıcı tüm cihazlardan çıkış yapıldı.
        </p>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={`Parola Sıfırla — ${user.email}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <FormField label="Yeni Parola (en az 8 karakter)">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            autoFocus
            className="w-full h-10 text-sm bg-surface border border-border rounded-md px-3"
            autoComplete="new-password"
          />
        </FormField>
        {error && (
          <p className="text-xs text-bad bg-[var(--color-bad-soft)] border border-bad/30 rounded-md p-2">
            {error}
          </p>
        )}
        <p className="text-[11px] text-muted">
          Parola sıfırlandığında kullanıcı tüm aktif oturumlardan çıkarılır.
        </p>
        <div className="flex gap-2 justify-end mt-1">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Vazgeç
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={busy}
            iconLeft={<Key size={14} />}
          >
            Sıfırla
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
