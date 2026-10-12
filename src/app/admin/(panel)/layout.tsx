import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { adminFetch } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await adminFetch<{ email: string }>("/api/admin/session");
  if (!session) redirect("/admin/login");
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
