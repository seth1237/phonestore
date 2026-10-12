import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCategory, getProductsByCategory, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [category, site] = await Promise.all([getCategory(Number(id)), getSite()]);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: `Shop ${category.name} at ${site.name} in Nairobi.`,
    alternates: { canonical: `/category/${category.id}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategory(Number(id));
  if (!category) notFound();
  const products = await getProductsByCategory(category.id);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start space-y-[2rem] px-4 py-8">
      <div className="flex w-full flex-col items-center justify-center px-4 py-2 lg:flex-row lg:justify-between">
        <nav aria-label="Breadcrumb" className="flex flex-row items-center space-x-2">
          <Link href="/" className="text-[0.875rem] text-muted">
            All Categories
          </Link>
          <p className="text-[0.875rem] text-muted">/</p>
          <p className="text-[0.875rem] text-black">{category.name}</p>
        </nav>
        <p className="text-[0.875rem] text-muted">
          Showing {products.length} of {products.length}
        </p>
      </div>
      <section className="flex w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white px-4 py-8 shadow-md">
        <h1 className="sr-only">{category.name}</h1>
        {products.length === 0 ? (
          <p className="w-full py-16 text-center font-inter text-2xl font-extrabold">No products to display</p>
        ) : (
          <div className="flex flex-row flex-wrap items-start justify-start gap-4 lg:items-center lg:justify-start">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
