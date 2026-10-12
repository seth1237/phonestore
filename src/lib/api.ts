import { cache } from "react";
import type { BlogPost, Category, Offer, Product, Review, ReviewStats, Site } from "@/lib/types";

const origin = process.env.API_ORIGIN || "http://127.0.0.1:3001";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${origin}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Shop API ${path} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const getSite = cache(() => getJson<Site>("/api/site"));
export const getCategories = cache(() => getJson<Category[]>("/api/categories"));
export const getProducts = cache(() => getJson<Product[]>("/api/products"));
export const getOffers = cache(() => getJson<Offer[]>("/api/offers"));
export const getPosts = cache(() => getJson<BlogPost[]>("/api/posts"));

export function getProduct(id: number) {
  return getJson<Product>(`/api/products/${id}`).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    throw error;
  });
}

export function getCategory(id: number) {
  return getJson<Category>(`/api/categories/${id}`).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    throw error;
  });
}

export function getProductsByCategory(id: number) {
  return getJson<Product[]>(`/api/categories/${id}/products`);
}

export function getPost(slug: string) {
  return getJson<BlogPost>(`/api/posts/${encodeURIComponent(slug)}`).catch((error: Error) => {
    if (error.message.endsWith("404")) return null;
    throw error;
  });
}

export function getReviews() {
  return getJson<{ stats: ReviewStats; reviews: Review[] }>("/api/reviews");
}

export function shopCategories(categories: Category[]) {
  return categories
    .filter((category) => category.count > 0 && category.image)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
