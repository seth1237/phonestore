import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSite } from "@/lib/api";
import "./globals.css";

const workSans = localFont({
  src: "./fonts/work-sans-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-work-sans",
});

const rubik = localFont({
  src: "./fonts/rubik-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-rubik",
});

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "400 800",
  display: "swap",
  variable: "--font-inter",
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
