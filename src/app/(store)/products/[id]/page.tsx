import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/product-purchase";
import { ReviewSection } from "@/components/reviews";
import { getProduct, getProductReviews, getSite } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { absoluteSiteUrl } from "@/lib/site-url";

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
      url: absoluteSiteUrl(`/products/${product.slug}`),
      images: [{ url: product.image || site.logo, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.image || site.logo],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const [reviewData, site] = await Promise.all([getProductReviews(product.id), getSite()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    image: product.photos.map((photo) => photo.url),
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="flex w-full flex-col space-y-8 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPurchase product={product} site={site} />
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
      <section className="w-full rounded-md bg-white px-6 py-8 shadow-md">
        <ReviewSection
          reviews={reviewData.reviews}
          stats={reviewData.stats}
          available={reviewData.available}
          title={`Reviews for ${product.name}`}
          reviewEndpoint={`/api/products/${encodeURIComponent(product.id)}/reviews`}
          emptyMessage={`No reviews for ${product.name} yet. Be the first to share your experience.`}
        />
      </section>
    </div>
  );
}
