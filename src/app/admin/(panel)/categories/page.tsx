import { AdminCategoriesPanel } from "@/components/admin-categories-panel";
import { adminFetch } from "@/lib/admin";
import type { Category, Product } from "@/lib/types";

export default async function AdminCategoriesPage() {
  const catalog = await adminFetch<{ products: Product[]; categories: Category[] }>("/api/admin/products");
  return (
    <>
      <header className="admin-header">
        <h1>Categories</h1>
      </header>
      <AdminCategoriesPanel products={catalog?.products || []} categories={catalog?.categories || []} />
    </>
  );
}
