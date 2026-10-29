import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/context/cart-context";
import { getCategories, getSite } from "@/lib/api";
import { siteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [site, categories] = await Promise.all([getSite(), getCategories()]);
  const origin = siteOrigin();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": ["Store", "ElectronicsStore"],
      name: site.name,
      url: origin,
      description: site.seo.description,
      telephone: site.phones,
      email: site.email || undefined,
      image: site.cover,
      priceRange: "KES",
      openingHours: "Mo-Fr 09:00-18:00",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address,
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: site.coordinates.lat,
        longitude: site.coordinates.lng,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/products?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <CartProvider>
      <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-page text-ink">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Header site={site} categories={categories} />
        <div className="mx-auto min-h-[80vh] w-full max-w-screen-xl flex-1">{children}</div>
        <Footer site={site} categories={categories} />
        <CookieBanner />
      </div>
    </CartProvider>
  );
}
