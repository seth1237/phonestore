import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to your Rai Merchants account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountPanel />;
}
