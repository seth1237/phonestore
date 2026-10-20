import Image from "next/image";
import Link from "next/link";
import { CategoryCard } from "@/components/category-card";
import { ProductCard } from "@/components/product-card";
import { AccentLink } from "@/components/accent-button";
import { getCategories, getProducts, getSite, topCategories } from "@/lib/api";
import { formatHours, mapsDirectionsUrl } from "@/lib/format";

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
      <section className="flex w-full flex-col items-center gap-8 rounded-md bg-white px-5 py-8 shadow-md lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex w-full flex-col items-center space-y-5 lg:w-[52%] lg:items-start">
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
        <div className="hidden h-80 w-[22rem] shrink-0 overflow-hidden rounded-md lg:block">
          <Image
            src={site.cover}
            alt={site.name}
            width={430}
            height={320}
            priority
            className="h-full w-full object-cover object-center"
          />
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

      <section
        id="about-us"
        aria-labelledby="about-us-heading"
        className="w-full rounded-md bg-white px-5 py-8 shadow-md lg:px-8"
      >
        <h2 id="about-us-heading" className="text-2xl font-bold">About Us</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink">
          {site.name} offers phones, laptops and accessories. Visit our shop or contact us to ask about products and availability.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-semibold text-ink">Visit us</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{site.address}</p>
            <a
              href={mapsDirectionsUrl(site.coordinates.lat, site.coordinates.lng)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block rounded text-sm font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Get directions
            </a>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Contact</h3>
            <div className="mt-2 flex flex-col items-start gap-2 text-sm">
              {site.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {phone}
                </a>
              ))}
              {site.email ? (
                <a
                  href={`mailto:${site.email}`}
                  className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {site.email}
                </a>
              ) : null}
              <Link
                href="/contact"
                className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Contact us
              </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-ink">Opening hours</h3>
            <dl className="mt-2 space-y-1 text-sm">
              {site.hours.map((slot) => (
                <div key={slot.day} className="flex justify-between gap-4">
                  <dt className="text-muted">{slot.day}</dt>
                  <dd className="font-medium text-ink">{formatHours(slot.open, slot.close)}</dd>
                </div>
              ))}
            </dl>
          </div>
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
