"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Mail, Package, Star, Tag, ClipboardList } from "lucide-react";
import { apiFetch, clearAdminSession } from "@/lib/client-api";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/offers", label: "Offers", icon: Tag },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/orders", label: "Quotations", icon: ClipboardList },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    clearAdminSession();
    await apiFetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-logo">Rai Merchants</Link>
        <div className="admin-label">Workspace</div>
        {nav.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={active ? "admin-nav active" : "admin-nav"}>
              <Icon size={17} /> {item.label}
            </Link>
          );
        })}
        <div className="admin-sidebar-bottom">
          <p className="admin-user-email">{email}</p>
          <button className="admin-nav" onClick={logout}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>
      <section className="admin-main">{children}</section>
    </main>
  );
}
