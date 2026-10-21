import Link from "next/link";
import { CategoryCard } from "@/components/category-card";
import { ProductCard } from "@/components/product-card";
import { AccentLink } from "@/components/accent-button";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { getCategories, getProducts, getSite, topCategories } from "@/lib/api";

export const dynamic = "force-dynamic";

const HOME_PREVIEW_LIMIT = 6;

export default async function HomePage() {
  const [site, categories, products] = await Promise.all([getSite(), getCategories(), getProducts()]);
  const shelves = topCategories(categories, 3);
  const heroTitle = "Phones, Laptops and all Accessories";
  const phonePrompt = site.phones.length ? ` or call ${site.phones.join(" or ")}` : "";
  const heroBody = `Explore our range of phones, laptops and accessories at ${site.name}. Visit us at ${site.address}${phonePrompt} to ask about product availability and details.`;

  return (
    <div className="flex h-full w-full flex-col items-center justify-start space-y-[2rem] px-4 py-8">
      <section className="relative flex w-full flex-col items-center gap-8 overflow-hidden rounded-md bg-white px-5 py-8 shadow-md lg:flex-row lg:items-center lg:justify-between lg:px-8">
        {/* bg.png / bg1.png - desktop only, crossfading on the right side */}
        <HeroSlideshow />

        <div className="relative flex w-full flex-col items-center space-y-5 lg:w-[52%] lg:items-start">
          <h1 className="text-center text-[1.75rem] font-bold tracking-tight uppercase lg:text-left lg:text-4xl">
            {heroTitle}
          </h1>
          <p className="text-center text-base leading-7 text-ink lg:text-left lg:text-lg lg:leading-8">{heroBody}</p>
          <div className="w-full sm:w-56">
            <AccentLink href="#categories" className="w-full py-3">
              {site.heroCta}
            </AccentLink>
          </div>
        </div>
      </section>

      <section id="categories" className="flex w-full flex-col items-start justify-start rounded-md bg-white px-5 py-8 shadow-md">
        <h2 className="mb-6 w-full text-center text-2xl font-bold">Shop by Categories</h2>
        <div className="grid w-full grid-cols-3 gap-3 sm:gap-4">
          {shelves.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {shelves.map((category) => {
        const preview = products.filter((product) => product.categoryId === category.id).slice(0, HOME_PREVIEW_LIMIT);
        return (
          <section
            key={category.id}
            className="flex w-full flex-col items-start rounded-md bg-white px-4 py-8 shadow-md"
          >
            <h2 className="w-full text-left text-2xl font-bold">{category.name}</h2>
            <div className="mt-8 flex w-full flex-row flex-wrap items-start justify-start gap-4 lg:items-center lg:justify-start">
              {preview.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link
              href={`/category/${category.slug}`}
              className="mt-7 flex h-12 w-full items-center justify-center rounded-lg border-0 bg-[#EA580C] text-sm font-bold text-white shadow-none transition-colors duration-200 hover:bg-[#C2410C]"
            >
              See All
            </Link>
          </section>
        );
      })}
    </div>
  );
}