import { adminFetch } from "@/lib/admin";

export default async function AdminOverviewPage() {
  const stats = await adminFetch<{
    products: number;
    hidden: number;
    categories: number;
    reviews: number;
    messages: number;
    orders: number;
    offers: number;
  }>("/api/admin/overview");

  const cards = [
    ["Products", stats?.products ?? 0],
    ["Hidden", stats?.hidden ?? 0],
    ["Categories", stats?.categories ?? 0],
    ["Reviews", stats?.reviews ?? 0],
    ["Messages", stats?.messages ?? 0],
    ["Quotations", stats?.orders ?? 0],
    ["Offers", stats?.offers ?? 0],
  ];

  return (
    <>
      <header className="admin-header">
        <h1>Overview</h1>
      </header>
      <div className="admin-stats">
        {cards.map(([label, value]) => (
          <div key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <section className="admin-card">
        <div className="card-title">
          <h3>Catalog</h3>
          <span>Product names, prices, and stock still come from the ERP. Photos you upload here are stored on Cloudinary, and the extra product details are stored in MongoDB.</span>
        </div>
      </section>
    </>
  );
}
