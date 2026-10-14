import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to see what you have bought, what has been dispatched, and what has been delivered.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountPanel />;
}
