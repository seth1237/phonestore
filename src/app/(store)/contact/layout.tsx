import type { Metadata } from "next";
import { getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "Contact",
    description: `Visit ${site.name} at ${site.address}, or call ${site.phone}.`,
    alternates: { canonical: "/contact" },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
