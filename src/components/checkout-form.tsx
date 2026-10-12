"use client";

import { useState } from "react";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import type { Site } from "@/lib/types";

export function CheckoutForm({ site }: { site: Site }) {
  const { detailed, total, clear, count } = useCart();
  const [quotation, setQuotation] = useState<{ id: string; number: string } | null>(null);
  const [error, setError] = useState("");
  const [invoiceError, setInvoiceError] = useState("");

  if (quotation) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start space-y-6 px-4 py-16">
        <h1 className="text-2xl font-bold">Quotation requested</h1>
        <p className="text-[1rem] leading-7">
          Thank you. {quotation.number ? `Quotation ${quotation.number} is with ${site.name}.` : `${site.name} has the quotation request.`} They will confirm it on {site.phone}.
        </p>
        {quotation.id ? (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-accent px-6 py-4 text-center text-[1rem] font-bold text-white shadow-md transition-colors hover:bg-secondary hover:text-white"
            onClick={async () => {
              setInvoiceError("");
              const response = await fetch(`/backend/api/quotations/${encodeURIComponent(quotation.id)}/invoice`);
              if (!response.ok) {
                const data = (await response.json().catch(() => null)) as { error?: string } | null;
                setInvoiceError(data?.error || "The invoice is not ready yet.");
                return;
              }
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${quotation.number || "invoice"}.pdf`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download invoice
          </button>
        ) : null}
        {invoiceError ? <p className="text-sm text-red-700">{invoiceError}</p> : null}
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
              location: form.get("location"),
              notes: form.get("notes"),
              items: detailed.map(({ product, qty }) => ({ productId: product.id, qty })),
            }),
          });
          if (!response.ok) {
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            setError(data?.error || "The quotation could not be sent. Try again.");
            return;
          }
          const data = (await response.json()) as { quotationId?: string; quotationNumber?: string };
          clear();
          setQuotation({ id: data.quotationId || "", number: data.quotationNumber || "" });
        }}
      >
        <h1 className="text-2xl font-bold">Request a quotation</h1>
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
        <label className="block text-sm font-semibold" htmlFor="checkout-location">
          Location
        </label>
        <input id="checkout-location" name="location" required className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="checkout-notes">
          Delivery notes
        </label>
        <textarea id="checkout-notes" name="notes" className="min-h-28 w-full rounded-md border border-line px-3 py-3 text-sm" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <AccentButton type="submit" disabled={!detailed.length}>
          Request quotation
        </AccentButton>
        {!detailed.length ? <p className="text-sm text-muted">Add items to your cart before requesting a quotation.</p> : null}
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
