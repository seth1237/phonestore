import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your order. The shop calls you back to arrange pickup.",
  alternates: { canonical: "/checkout" },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
