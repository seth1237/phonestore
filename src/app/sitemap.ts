import type { MetadataRoute } from "next";
import { getCategories, getPosts, getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts] = await Promise.all([getCategories(), getProducts(), getPosts()]);
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const staticRoutes = ["", "/products", "/reviews", "/offers", "/blog", "/contact", "/cart", "/account", "/checkout"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const categoryRoutes = categories.map((category) => ({
    url: `${base}/category/${category.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const productRoutes = products.map((product) => ({
    url: `${base}/products/${product.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  const blog = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));
  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blog];
}
