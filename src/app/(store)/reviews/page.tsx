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
  const { reviews, stats } = await getReviews();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center font-work">
      <ReviewSection reviews={reviews} stats={stats} showBrowse />
    </div>
  );
}
