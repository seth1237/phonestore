import { AdminProductsPanel } from "@/components/admin-products-panel";
import { adminFetch } from "@/lib/admin";
import type { Category, Product } from "@/lib/types";

export default async function AdminProductsPage() {
  const catalog = await adminFetch<{ products: Product[]; categories: Category[] }>("/api/admin/products");
  return (
    <>
      <header className="admin-header">
        <h1>Products</h1>
      </header>
      <AdminProductsPanel products={catalog?.products || []} categories={catalog?.categories || []} />
    </>
  );
}
