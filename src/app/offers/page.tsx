import type { Metadata } from "next";
import { OffersBoard } from "@/components/offers-board";
import { getOffers, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "Offers",
    description: `Current offers from ${site.name}.`,
    alternates: { canonical: "/offers" },
  };
}

export default async function OffersPage() {
  const offers = await getOffers();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-5 lg:py-8">
      <OffersBoard offers={offers} />
    </div>
  );
}
