import { cache } from "react";
import { apiUrl, usesEmbeddedApi } from "@/lib/api-origin";
import type { BlogPost, Category, Offer, Product, ReviewCollection, ReviewStats, Site } from "@/lib/types";

const closed = Array(24).fill(0);

const fallbackSite: Site = {
  name: "Rai Merchants Limited",
  legalName: "Rai Merchants Limited",
  tagline: "PHONES, ACCESSORIES AND GADGETS",
  heroTitle: "Phones, accessories and gadgets",
  heroBody:
    "We sell phones, accessories, and gadgets from Njoguini Building, at the intersection of Ronald Ngala Street and Mfangano Street. The shop is open Monday to Friday, 9am to 6pm. Call 0702119333 or 0717159863.",
  heroCta: "Shop now",
  logo: "/logo.png",
  cover: "/media/cover.jpg",
  phones: ["0702119333", "0717159863"],
  phone: "0702119333 / 0717159863",
  email: "",
  whatsapp: "",
  address: "Njoguini Building, intersection of Ronald Ngala Street and Mfangano Street, Nairobi",
  coordinates: { lat: -1.2854, lng: 36.8286 },
  currency: "KSH",
  footerBlurb: "Phones, accessories, and gadgets from Njoguini Building, where Ronald Ngala Street meets Mfangano Street.",
  credit: { label: "Made with ❤️ by tappi", href: "https://tappi.app" },
  social: { facebook: "", instagram: "", website: "" },
  seo: {
    title: "Rai Merchants Limited — phones, accessories and gadgets in Nairobi",
    description:
      "Shop phones, accessories, and gadgets at Njoguini Building, at the intersection of Ronald Ngala Street and Mfangano Street. Open Monday to Friday, 9am to 6pm. Call 0702119333 or 0717159863.",
    keywords: ["phones", "accessories", "gadgets", "Nairobi", "Ronald Ngala", "Mfangano", "Njoguini Building"],
  },
  hours: [
    { day: "Monday", open: "09:00", close: "18:00" },
    { day: "Tuesday", open: "09:00", close: "18:00" },
    { day: "Wednesday", open: "09:00", close: "18:00" },
    { day: "Thursday", open: "09:00", close: "18:00" },
    { day: "Friday", open: "09:00", close: "18:00" },
    { day: "Saturday", open: "00:00", close: "00:00" },
    { day: "Sunday", open: "00:00", close: "00:00" },
  ],
  popularHours: { SUN: closed, MON: closed, TUE: closed, WED: closed, THU: closed, FRI: closed, SAT: closed },
};

const emptyReviewStats: ReviewStats = {
  average_rating: 0,
  rating_total: 0,
  review_total: 0,
  five_star_reviews: 0,
  four_star_reviews: 0,
  three_star_reviews: 0,
  two_star_reviews: 0,
  one_star_reviews: 0,
};

async function getJson<T>(path: string): Promise<T> {
  if (usesEmbeddedApi()) {
    const { callApiJson } = await import("@/lib/embedded-api");
    return callApiJson<T>("GET", path);
  }
  const response = await fetch(apiUrl(path), { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) {
    throw new Error(`Shop API ${path} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function unavailable<T>(path: string, fallback: T) {
  return (error: unknown) => {
    const message = error instanceof Error ? error.message : "The shop API did not respond.";
    console.error(`Shop API ${path} is unavailable:`, message);
    return fallback;
  };
}

export const getSite = cache(() => getJson<Site>("/api/site").catch(unavailable("/api/site", fallbackSite)));
export const getCategories = cache(() => getJson<Category[]>("/api/categories").catch(unavailable("/api/categories", [])));
export const getProducts = cache(() => getJson<Product[]>("/api/products").catch(unavailable("/api/products", [])));
export const getOffers = cache(() => getJson<Offer[]>("/api/offers").catch(unavailable("/api/offers", [])));
export const getPosts = cache(() => getJson<BlogPost[]>("/api/posts").catch(unavailable("/api/posts", [])));

export function getProduct(id: string) {
  const path = `/api/products/${encodeURIComponent(id)}`;
  return getJson<Product>(path).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    return unavailable(path, null)(error);
  });
}

export function getCategory(id: string) {
  const path = `/api/categories/${encodeURIComponent(id)}`;
  return getJson<Category>(path).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    return unavailable(path, null)(error);
  });
}

export function getProductsByCategory(id: string) {
  const path = `/api/categories/${encodeURIComponent(id)}/products`;
  return getJson<Product[]>(path).catch(unavailable(path, []));
}

export function getPost(slug: string) {
  const path = `/api/posts/${encodeURIComponent(slug)}`;
  return getJson<BlogPost>(path).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    return unavailable(path, null)(error);
  });
}

export function getReviews() {
  return getJson<ReviewCollection>("/api/reviews").catch(
    unavailable("/api/reviews", { stats: emptyReviewStats, reviews: [], available: false }),
  );
}

export function getProductReviews(id: string) {
  const path = `/api/products/${encodeURIComponent(id)}/reviews`;
  return getJson<ReviewCollection>(path).catch(
    unavailable(path, { stats: emptyReviewStats, reviews: [], available: false }),
  );
}

export function shopCategories(categories: Category[]) {
  return categories
    .filter((category) => category.count > 0)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function topCategories(categories: Category[], limit = 3) {
  return categories
    .filter((category) => category.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .slice(0, limit);
}
