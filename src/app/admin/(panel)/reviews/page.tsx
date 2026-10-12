import { AdminReviewsPanel } from "@/components/admin-reviews-panel";
import { adminFetch } from "@/lib/admin";
import type { Review } from "@/lib/types";

export default async function AdminReviewsPage() {
  const data = await adminFetch<{ reviews: Review[] }>("/api/admin/reviews");
  return (
    <>
      <header className="admin-header">
        <h1>Reviews</h1>
      </header>
      <AdminReviewsPanel reviews={data?.reviews || []} />
    </>
  );
}
