"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Headset,
  LifeBuoy,
  Layers,
  BookOpen,
  Sparkles,
  ListTree,
  FileText,
  Timer,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "./cn";

type Role = "super_admin" | "L1_agent" | "L1_lead" | "L2_agent" | "L2_lead";
type User = { id: number; name: string; email: string; role: Role };

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Süper Admin",
  L1_agent: "L1 Agent",
  L1_lead: "L1 Team Lead",
  L2_agent: "L2 Agent",
  L2_lead: "L2 Team Lead",
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LifeBuoy;
  roles?: Role[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: "Operasyon",
    items: [
      { href: "/support/cc", label: "Çağrı Merkezi", icon: Headset },
      { href: "/support", label: "Quick Analiz", icon: LifeBuoy },
    ],
  },
  {
    title: "Analitik",
    items: [
      { href: "/support/topics", label: "Konular", icon: ListTree },
      { href: "/support/duration", label: "Süreler", icon: Timer },
      { href: "/support/clusters", label: "Kümeler", icon: Layers },
      { href: "/support/known-issues", label: "Bilinen Sorunlar", icon: Sparkles },
    ],
  },
  {
    title: "Kaynaklar",
    items: [
      { href: "/support/guides", label: "Kılavuzlar", icon: FileText },
      { href: "/support/solutions", label: "Çözüm Bankası", icon: BookOpen },
    ],
  },
  {
    title: "Yönetim",
    items: [
      {
        href: "/admin/users",
        label: "Kullanıcılar",
        icon: Users,
        roles: ["super_admin"],
      },
      {
        href: "/admin/kb",
        label: "Bilgi Bankası",
        icon: BookOpen,
        roles: ["super_admin"],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: User | null }) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  if (pathname === "/login") return null;

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-dvh sticky top-0">
      {/* Logo */}
      <Link
        href="/support/cc"
        className="flex items-center gap-2.5 px-4 h-14 border-b border-border group"
      >
        <div className="size-7 rounded-lg bg-accent text-accent-fg font-bold flex items-center justify-center text-sm shadow-sm group-hover:shadow-md transition-shadow">
          ED
        </div>
        <span className="font-semibold tracking-tight text-[14px] leading-tight">
          EnRoute Destek
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {SECTIONS.map((section) => {
          const visible = section.items.filter((item) => {
            if (!item.roles) return true;
            if (!me) return false;
            return item.roles.includes(me.role);
          });
          if (visible.length === 0) return null;
          return (
            <div key={section.title} className="mb-4 last:mb-0">
              <div className="text-[10px] uppercase tracking-wider text-muted font-semibold px-2 mb-1">
                {section.title}
              </div>
              <ul className="flex flex-col gap-0.5">
                {visible.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2 px-2 h-8 rounded-md text-sm transition-colors",
                          active
                            ? "bg-[var(--color-accent-soft)] text-accent font-medium"
                            : "text-fg-2 hover:text-fg hover:bg-surface-2",
                        )}
                      >
                        <Icon size={15} strokeWidth={2} />
                        <span className="truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      {me && (
        <div className="border-t border-border p-3 flex items-center gap-2">
          <div
            className="size-8 rounded-full bg-[var(--color-accent-soft)] text-accent font-semibold flex items-center justify-center text-xs shrink-0"
            title={me.name}
          >
            {initials(me.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium leading-tight truncate">
              {me.name}
            </div>
            <div className="text-[10px] text-muted leading-tight truncate">
              {ROLE_LABELS[me.role]}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="size-7 rounded-md text-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center shrink-0"
            title="Çıkış"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase().slice(0, 2);
}
