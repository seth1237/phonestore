import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/product-purchase";
import { CategoryProductCarousel } from "@/components/category-product-carousel";
import { ReviewSection } from "@/components/reviews";
import { getProduct, getProductReviews, getProductsByCategory, getSite } from "@/lib/api";
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
  const [reviewData, site, categoryProducts] = await Promise.all([
    getProductReviews(product.id),
    getSite(),
    product.categoryId ? getProductsByCategory(product.categoryId) : Promise.resolve([]),
  ]);
  const sameCategoryProducts = categoryProducts.filter((item) => item.id !== product.id);

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
      <section className="w-full rounded-md bg-white px-6 py-8 shadow-md">
        <ReviewSection
          reviews={reviewData.reviews}
          stats={reviewData.stats}
          available={reviewData.available}
          title={`Reviews for ${product.name}`}
          reviewEndpoint={`/api/products/${encodeURIComponent(product.id)}/reviews`}
          emptyMessage="Be the first to review this product."
        />
      </section>
      <CategoryProductCarousel products={sameCategoryProducts} category={product.category || "this category"} />
    </div>
  );
}
