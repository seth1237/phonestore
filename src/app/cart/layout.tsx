import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the promotional products in your cart.",
  alternates: { canonical: "/cart" },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
