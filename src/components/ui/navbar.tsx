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
  Network,
} from "lucide-react";
import { cn } from "./cn";

type Role = "super_admin" | "L1_agent" | "L1_lead" | "L2_agent" | "L2_lead";
type User = { id: number; name: string; email: string; role: Role };

type NavItem = {
  href: string;
  label: string;
  icon: typeof LifeBuoy;
  roles?: Role[]; // verilmezse herkese görünür
};

const NAV_ITEMS: NavItem[] = [
  { href: "/support/cc", label: "Çağrı Merkezi", icon: Headset },
  { href: "/support", label: "Quick Analiz", icon: LifeBuoy },
  { href: "/support/topics", label: "Konular", icon: ListTree },
  { href: "/support/categories", label: "Kategoriler", icon: Network },
  { href: "/support/duration", label: "Süreler", icon: Timer },
  { href: "/support/guides", label: "Kılavuzlar", icon: FileText },
  { href: "/support/clusters", label: "Kümeler", icon: Layers },
  { href: "/support/known-issues", label: "Bilinen Sorunlar", icon: Sparkles },
  { href: "/support/solutions", label: "Çözüm Bankası", icon: BookOpen },
  {
    href: "/admin/users",
    label: "Kullanıcılar",
    icon: Users,
    roles: ["super_admin"],
  },
];

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => {
    if (pathname === "/login") return; // login sayfasında user fetch'leme
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: User | null }) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  if (pathname === "/login") return null;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!me) return false;
    return item.roles.includes(me.role);
  });

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
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-[1600px] px-5 h-14 flex items-center justify-between gap-3">
        <Link href="/support/cc" className="flex items-center gap-2.5 group">
          <div className="size-7 rounded-lg bg-accent text-accent-fg font-bold flex items-center justify-center text-sm shadow-sm group-hover:shadow-md transition-shadow">
            ED
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold tracking-tight text-[15px]">
              EnRoute Destek Merkezi
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors whitespace-nowrap",
                  active
                    ? "bg-[var(--color-accent-soft)] text-accent font-medium"
                    : "text-muted hover:text-fg hover:bg-surface-2",
                )}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {me && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <div className="text-xs font-medium leading-tight">{me.name}</div>
              <div className="text-[10px] text-muted leading-tight">{me.role}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="size-9 rounded-md text-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center"
              title="Çıkış"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
