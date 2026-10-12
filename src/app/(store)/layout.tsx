import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/context/cart-context";
import { getCategories, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [site, categories] = await Promise.all([getSite(), getCategories()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: site.name,
    description: site.seo.description,
    telephone: site.phones,
    email: site.email || undefined,
    image: site.cover,
    openingHours: "Mo-Fr 09:00-18:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
  };

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
