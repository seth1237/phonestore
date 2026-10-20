import type { Metadata } from "next";
import { ProductsBrowser } from "@/components/products-browser";
import { getCategories, getProducts, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "Products",
    description: `Browse phones, accessories, and gadgets from ${site.name}.`,
    alternates: { canonical: "/products" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string }>;
}) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <ProductsBrowser searchParams={searchParams} products={products} categories={categories} />;
}
