import type { Metadata } from "next";
import { ReviewSection } from "@/components/reviews";
import { getReviews, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "Reviews",
    description: `Ratings and reviews for ${site.name}.`,
    alternates: { canonical: "/reviews" },
  };
}

export default async function ReviewsPage() {
  const { reviews, stats, available } = await getReviews();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center py-8 font-work">
      <h1 className="mb-4 w-full px-6 text-2xl font-bold">Shop Reviews</h1>
      <ReviewSection reviews={reviews} stats={stats} available={available} showBrowse />
    </div>
  );
}
