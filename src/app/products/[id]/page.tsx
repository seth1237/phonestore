import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/product-purchase";
import { ReviewSection } from "@/components/reviews";
import { getProduct, getReviews, getSite } from "@/lib/api";
import { isInStock } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [product, site] = await Promise.all([getProduct(Number(id)), getSite()]);
  if (!product) return { title: "Product" };
  const description =
    product.description ||
    `${product.name} from ${site.name}${product.category ? ` in ${product.category}` : ""}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviewData] = await Promise.all([getProduct(Number(id)), getReviews()]);
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
      availability: isInStock(product.price) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: "2027-12-31",
    },
  };

  return (
    <div className="flex w-full flex-col space-y-8 px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPurchase product={product} />
      <section className="flex w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white pb-8 shadow-md">
        <div className="flex w-full flex-col items-start justify-start space-y-[1rem] rounded-[2.13rem] px-[1.5rem] py-[2.5rem]">
          <h2 className="text-[1.5rem] font-bold">Reviews</h2>
          <ReviewSection reviews={reviewData.reviews} stats={reviewData.stats} />
        </div>
      </section>
    </div>
  );
}
