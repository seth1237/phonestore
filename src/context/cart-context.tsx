"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/types";

export type CartLine = {
  id: string;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  detailed: { product: Product; qty: number }[];
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "promo-hub-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as CartLine[];
        setLines(saved.map((line) => ({ id: String(line.id), qty: Number(line.qty) || 1 })));
      }
    } catch {
      setLines([]);
    }
    setReady(true);
    fetch("/backend/api/products")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Product[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((id: string, qty = 1) => {
    const amount = Math.max(1, qty);
    setLines((current) => {
      const existing = current.find((line) => line.id === id);
      if (!existing) return [...current, { id, qty: amount }];
      return current.map((line) =>
        line.id === id ? { ...line, qty: line.qty + amount } : line,
      );
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((current) => {
      if (qty <= 0) return current.filter((line) => line.id !== id);
      return current.map((line) => (line.id === id ? { ...line, qty } : line));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const detailed = useMemo(
    () =>
      lines
        .map((line) => {
          const product = products.find((item) => item.id === line.id);
          return product ? { product, qty: line.qty } : null;
        })
        .filter((line): line is { product: Product; qty: number } => Boolean(line)),
    [lines, products],
  );

  const count = detailed.reduce((sum, line) => sum + line.qty, 0);
  const total = detailed.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  const value = useMemo(
    () => ({ lines, count, ready, add, setQty, remove, clear, detailed, total }),
    [lines, count, ready, add, setQty, remove, clear, detailed, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
