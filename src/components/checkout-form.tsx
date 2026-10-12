"use client";

import { useState } from "react";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import type { Site } from "@/lib/types";

export function CheckoutForm({ site }: { site: Site }) {
  const { detailed, total, clear, count } = useCart();
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  if (placed) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start space-y-6 px-4 py-16">
        <h1 className="text-2xl font-bold">Order received</h1>
        <p className="text-[1rem] leading-7">
          Thank you. {site.name} will confirm this order on {site.phone}. Payment is taken in the shop.
        </p>
        <AccentLink href="/products" className="w-auto px-6">
          RETURN TO SHOP
        </AccentLink>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-8 lg:flex-row">
      <form
        className="w-full space-y-4 rounded-md bg-white px-4 py-8 shadow-md lg:w-[60%]"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!detailed.length) return;
          setError("");
          const form = new FormData(event.currentTarget);
          const response = await fetch("/backend/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.get("name"),
              phone: form.get("phone"),
              email: form.get("email"),
              notes: form.get("notes"),
              items: detailed.map(({ product, qty }) => ({ productId: product.id, qty })),
            }),
          });
          if (!response.ok) {
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            setError(data?.error || "The order could not be saved. Try again.");
            return;
          }
          clear();
          setPlaced(true);
        }}
      >
        <h1 className="text-2xl font-bold">Checkout</h1>
        <label className="block text-sm font-semibold" htmlFor="checkout-name">
          Full name
        </label>
        <input id="checkout-name" name="name" required className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="checkout-phone">
          Phone
        </label>
        <input id="checkout-phone" name="phone" required type="tel" className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="checkout-email">
          Email
        </label>
        <input id="checkout-email" name="email" required type="email" className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="checkout-notes">
          Delivery notes
        </label>
        <textarea id="checkout-notes" name="notes" className="min-h-28 w-full rounded-md border border-line px-3 py-3 text-sm" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <AccentButton type="submit" disabled={!detailed.length}>
          Place order
        </AccentButton>
        {!detailed.length ? <p className="text-sm text-muted">Add items to your cart before placing an order.</p> : null}
      </form>
      <aside className="h-fit w-full rounded-md bg-white px-4 py-8 shadow-md lg:w-[40%]">
        <h2 className="text-2xl font-bold">Summary</h2>
        <ul className="mt-6 space-y-3">
          {detailed.map(({ product, qty }) => (
            <li key={product.id} className="flex justify-between text-sm">
              <span>
                {product.name} × {qty}
              </span>
              <span className="font-semibold">{formatPrice(product.price * qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-line pt-4 text-sm font-semibold">
          <span>{count} items</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  );
}
