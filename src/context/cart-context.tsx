"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";
import { parseCartLineId, variantLabel, variantPhotos, variantPrice } from "@/lib/variants";

export type CartLine = {
  id: string;
  qty: number;
};

export type CartDetail = {
  lineId: string;
  product: Product;
  variant: ProductVariant | null;
  qty: number;
  price: number;
  label: string;
  thumb: string;
  availableQuantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  catalogReady: boolean;
  catalogError: boolean;
  invalidLines: CartLine[];
  stockIssueLines: CartLine[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  detailed: CartDetail[];
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "promo-hub-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as unknown;
        if (Array.isArray(saved)) {
          setLines(
            saved
              .filter((line): line is { id: string; qty: number } =>
                Boolean(line && typeof line.id === "string" && Number.isFinite(Number(line.qty))),
              )
              .map((line) => ({ id: line.id, qty: Math.max(1, Math.floor(Number(line.qty))) })),
          );
        }
      }
    } catch {
      setLines([]);
    }
    setReady(true);
    apiFetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog request returned ${response.status}`);
        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) throw new Error("Catalog response was not a product list");
        setProducts(data as Product[]);
      })
      .catch((error: unknown) => {
        console.error("Cart catalog could not be loaded:", error);
        setCatalogError(true);
      })
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((id: string, qty = 1) => {
    const { productId, variantId } = parseCartLineId(id);
    const product = products.find((item) => item.id === productId);
    const variant = variantId ? product?.variants?.find((item) => item.id === variantId) : null;
    const available = variant ? variant.stock : product?.stock;
    const amount = Math.max(1, Math.floor(qty));
    if (available !== undefined && available < 1) return;
    setLines((current) => {
      const existing = current.find((line) => line.id === id);
      const nextQty = Math.min(available ?? Number.MAX_SAFE_INTEGER, (existing?.qty || 0) + amount);
      if (!existing) return [...current, { id, qty: nextQty }];
      return current.map((line) => line.id === id ? { ...line, qty: nextQty } : line);
    });
  }, [products]);

  const setQty = useCallback((id: string, qty: number) => {
    const { productId, variantId } = parseCartLineId(id);
    const product = products.find((item) => item.id === productId);
    const variant = variantId ? product?.variants?.find((item) => item.id === variantId) : null;
    const available = variant ? variant.stock : product?.stock;
    setLines((current) => {
      if (qty <= 0) return current.filter((line) => line.id !== id);
      if (available !== undefined && available < 1) return current;
      const safeQty = Math.max(1, Math.floor(qty));
      const nextQty = available === undefined ? safeQty : Math.min(safeQty, available);
      return current.map((line) => (line.id === id ? { ...line, qty: nextQty } : line));
    });
  }, [products]);

  const remove = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const detailed = useMemo(
    () =>
      lines
        .map((line) => {
          const { productId, variantId } = parseCartLineId(line.id);
          const product = products.find((item) => item.id === productId);
          if (!product) return null;
          const variant = variantId ? (product.variants || []).find((item) => item.id === variantId) || null : null;
          if (variantId && !variant) return null;
          const photos = variantPhotos(product, variant);
          const availableQuantity = Math.max(0, Math.floor(variant ? variant.stock : product.stock));
          return {
            lineId: line.id,
            product,
            variant,
            qty: line.qty,
            price: variantPrice(product, variant),
            label: variant ? variantLabel(variant) : "",
            thumb: photos[0]?.thumb || product.thumb,
            availableQuantity,
          };
        })
        .filter((line): line is CartDetail => Boolean(line)),
    [lines, products],
  );

  const invalidLines = useMemo(() => {
    if (!catalogReady || catalogError) return [];
    const detailedIds = new Set(detailed.map((line) => line.lineId));
    return lines.filter((line) => !detailedIds.has(line.id));
  }, [catalogReady, catalogError, detailed, lines]);
  const stockIssueLines = useMemo(
    () => detailed
      .filter((line) => line.availableQuantity < 1 || line.qty > line.availableQuantity)
      .map(({ lineId, qty }) => ({ id: lineId, qty })),
    [detailed],
  );
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = detailed.reduce((sum, line) => sum + line.price * line.qty, 0);

  const value = useMemo(
    () => ({
      lines, count, ready, catalogReady, catalogError, invalidLines, stockIssueLines,
      add, setQty, remove, clear, detailed, total,
    }),
    [lines, count, ready, catalogReady, catalogError, invalidLines, stockIssueLines, add, setQty, remove, clear, detailed, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
