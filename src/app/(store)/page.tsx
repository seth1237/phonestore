import Link from "next/link";
import { CategoryCarousel } from "@/components/category-carousel";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts, shopCategories, topCategories } from "@/lib/api";

export const dynamic = "force-dynamic";

const HOME_PREVIEW_LIMIT = 6;

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const shelves = topCategories(categories, 3);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start space-y-[2rem] px-4 py-8">
      <CategoryCarousel categories={shopCategories(categories)} />

      {shelves.map((category) => {
        const preview = products.filter((product) => product.categoryId === category.id).slice(0, HOME_PREVIEW_LIMIT);
        return (
          <section
            key={category.id}
            className="glass-panel flex w-full flex-col items-start rounded-xl px-4 py-8"
          >
            <h2 className="w-full text-left text-2xl font-bold">{category.name}</h2>
            <div className="mt-8 flex w-full flex-row flex-wrap items-start justify-start gap-4 lg:items-center lg:justify-start">
              {preview.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link
              href={`/category/${category.slug}`}
              className="mt-7 flex h-12 w-full items-center justify-center rounded-lg border-0 bg-[#EA580C] text-sm font-bold text-white shadow-none transition-all duration-300 hover:bg-[#C2410C] hover:shadow-md active:scale-[0.99]"
            >
              See All
            </Link>
          </section>
        );
      })}
    </div>
  );
}
