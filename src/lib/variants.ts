import type { Product, ProductVariant } from "@/lib/types";

const SWATCHES: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f4",
  silver: "#c0c7ce",
  gold: "#c9a227",
  blue: "#1d4ed8",
  "deep blue": "#1e3a8a",
  navy: "#00275a",
  orange: "#ea580c",
  "cosmic orange": "#c2410c",
  red: "#dc2626",
  green: "#15803d",
  purple: "#6d28d9",
  pink: "#db2777",
  gray: "#6b7280",
  grey: "#6b7280",
  graphite: "#3f3f46",
  titanium: "#a1a1aa",
};

export function cartLineId(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function parseCartLineId(id: string) {
  const split = id.indexOf("::");
  if (split < 0) return { productId: id, variantId: "" };
  return { productId: id.slice(0, split), variantId: id.slice(split + 2) };
}

export function variantLabel(variant: Pick<ProductVariant, "color" | "storage">) {
  return [variant.color, variant.storage].filter(Boolean).join(", ");
}

export function variantPrice(product: Product, variant?: ProductVariant | null) {
  if (variant && variant.price > 0) return variant.price;
  return product.price;
}

export function variantStock(product: Product, variant?: ProductVariant | null) {
  if (variant) return variant.stock;
  return product.stock;
}

export function variantPhotos(product: Product, variant?: ProductVariant | null) {
  if (variant?.images.length) return variant.images;
  return product.photos;
}

export function defaultVariant(product: Product) {
  const variants = product.variants || [];
  return variants.find((item) => item.stock > 0) || variants[0] || null;
}

export function defaultCartLineId(product: Product) {
  const variant = defaultVariant(product);
  return cartLineId(product.id, variant?.id);
}

export function swatchColor(color: string) {
  const key = color.trim().toLowerCase();
  if (SWATCHES[key]) return SWATCHES[key];
  const match = Object.keys(SWATCHES).find((name) => key.includes(name));
  return match ? SWATCHES[match] : "#d1d5db";
}
