import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/product-purchase";
import { ReviewSection } from "@/components/reviews";
import { getProduct, getReviews, getSite } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [product, site] = await Promise.all([getProduct(id), getSite()]);
  if (!product) return { title: "Product" };
  const description =
    product.description ||
    `${product.name} from ${site.name}${product.category ? ` in ${product.category}` : ""}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviewData] = await Promise.all([getProduct(id), getReviews()]);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.photos.map((photo) => photo.url),
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: "2027-12-31",
    },
  };

  return (
    <div className="flex w-full flex-col space-y-8 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPurchase product={product} />
      {product.related?.length ? (
        <section className="rounded-md bg-white px-4 py-8 shadow-md">
          <h2 className="text-2xl font-bold">Also with this product</h2>
          <div className="mt-6 flex flex-wrap gap-4">
            {product.related.map((item) => (
              <Link key={item.id} href={`/products/${item.slug}`} className="w-40 overflow-hidden rounded-md border border-line bg-white">
                <span className="relative block h-36 w-full bg-[#f3f4f6]">
                  {item.thumb ? <Image src={item.thumb} alt={item.name} fill sizes="160px" className="object-cover" /> : null}
                </span>
                <span className="block px-3 py-3">
                  <span className="line-clamp-2 text-sm font-semibold text-accent">{item.name}</span>
                  <span className="mt-1 block text-sm font-bold text-accent">{formatPrice(item.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className="flex w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white pb-8 shadow-md">
        <div className="flex w-full flex-col items-start justify-start space-y-[1rem] rounded-[2.13rem] px-[1.5rem] py-[2.5rem]">
          <h2 className="text-[1.5rem] font-bold">Reviews</h2>
          <ReviewSection reviews={reviewData.reviews} stats={reviewData.stats} />
        </div>
      </section>
    </div>
  );
}
