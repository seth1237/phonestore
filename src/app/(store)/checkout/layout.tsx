import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay for your order with M-Pesa.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
