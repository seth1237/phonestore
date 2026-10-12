import type { Metadata } from "next";
import { Inter, Rubik, Work_Sans } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/context/cart-context";
import { getCategories, getSite } from "@/lib/api";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: site.seo.title,
      template: `%s | ${site.name}`,
    },
    description: site.seo.description,
    keywords: site.seo.keywords,
    alternates: { canonical: "/" },
    openGraph: {
      title: site.seo.title,
      description: site.seo.description,
      url: siteUrl,
      siteName: site.name,
      images: [{ url: site.logo, width: 300, height: 100, alt: `${site.name} logo` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.seo.title,
      description: site.seo.description,
      images: [site.logo],
    },
    icons: { icon: site.logo, apple: site.logo },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
    <html lang="en" className={`${workSans.variable} ${rubik.variable} ${inter.variable}`}>
      <body className={`${workSans.className} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <CartProvider>
          <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-page text-ink">
            <Header site={site} categories={categories} />
            <div className="mx-auto min-h-[80vh] w-full max-w-screen-xl flex-1">{children}</div>
            <Footer site={site} categories={categories} />
            <CookieBanner />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
