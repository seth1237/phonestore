import type { Metadata } from "next";
import { Inter, Rubik, Work_Sans } from "next/font/google";
import { getSite } from "@/lib/api";
import { siteOrigin } from "@/lib/site-url";
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
  const siteUrl = siteOrigin();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: site.seo.title,
      template: `%s | ${site.name}`,
    },
    description: site.seo.description,
    keywords: site.seo.keywords,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title: site.seo.title,
      description: site.seo.description,
      url: siteUrl,
      locale: "en_KE",
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
    icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${workSans.variable} ${rubik.variable} ${inter.variable}`}>
      <body className={`${workSans.className} antialiased`}>{children}</body>
    </html>
  );
}
