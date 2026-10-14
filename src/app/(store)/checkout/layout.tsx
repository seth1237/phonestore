import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay for your order with M-Pesa.",
  alternates: { canonical: "/checkout" },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
