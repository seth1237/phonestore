"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { Price } from "@/components/price";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const {
    detailed,
    setQty,
    remove,
    total,
    count,
    ready,
    catalogReady,
    catalogError,
    invalidLines,
    stockIssueLines,
    lines,
  } = useCart();
  const checkoutReady =
    ready && catalogReady && !catalogError && detailed.length > 0 && !invalidLines.length && !stockIssueLines.length;

  return (
    <div className="flex h-full w-full flex-col items-start justify-start space-y-8 px-4 py-8 lg:flex-row lg:space-y-[2rem] lg:space-x-[2rem]">
      <section className="flex w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white px-4 py-8 shadow-md">
        <h1 className="w-fit text-left text-2xl font-bold">Cart</h1>
        {!ready || (lines.length > 0 && !catalogReady) ? (
          <p className="w-full py-8 text-center text-sm text-muted" role="status">Loading your saved cart and checking availability…</p>
        ) : catalogError ? (
          <div className="w-full space-y-4 rounded-md bg-page p-5" role="alert">
            <p className="font-semibold">We couldn’t check the products in your saved cart.</p>
            <p className="text-sm text-muted">Your cart has been kept. Reload this page to try again, or call the shop for help.</p>
            <Link className="inline-block font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href="/contact">
              Contact the shop
            </Link>
          </div>
        ) : detailed.length === 0 && invalidLines.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-5">
              <p className="text-center font-inter text-xl font-bold">Your cart is empty</p>
              <p className="text-center text-sm text-muted">Browse the catalogue to find something you need.</p>
              <div className="mb-10 w-fit">
                <AccentLink href="/products" className="w-auto px-6">
                  Browse products
                </AccentLink>
              </div>
            </div>
          </div>
        ) : (
          <>
            {invalidLines.length ? (
              <div className="w-full space-y-2 rounded-md border border-[#b91c1c] bg-white p-4" role="alert">
                <p className="font-semibold text-[#991b1b]">Some saved items are no longer available.</p>
                <ul className="space-y-2">
                  {invalidLines.map((line) => (
                    <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>Unavailable saved item</span>
                      <button
                        type="button"
                        aria-label="Remove unavailable item"
                        onClick={() => remove(line.id)}
                        className="rounded p-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="flex w-full flex-col gap-4">
              {detailed.map(({ lineId, product, qty, price, label, thumb, availableQuantity }) => (
                <li key={lineId} className="flex w-full flex-wrap items-center gap-3 border-b border-line pb-4 sm:flex-nowrap sm:gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#f3f4f6]">
                    {thumb ? <Image src={thumb} alt="" fill sizes="80px" className="object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{product.name}</p>
                    {label ? <p className="text-xs text-muted">{label}</p> : null}
                    <p className="text-sm font-bold text-accent"><Price amount={price} /></p>
                    {availableQuantity < 1 ? (
                      <p className="mt-1 text-xs font-semibold text-[#991b1b]">Currently out of stock.</p>
                    ) : qty > availableQuantity ? (
                      <p className="mt-1 text-xs font-semibold text-[#991b1b]">Only {availableQuantity} available. Reduce the quantity to continue.</p>
                    ) : null}
                  </div>
                  <div className="flex items-center rounded-md border border-line">
                    <button
                      type="button"
                      aria-label={qty === 1 ? `Remove ${product.name} from cart` : `Decrease ${product.name} quantity`}
                      className="rounded p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                      onClick={() => setQty(lineId, qty - 1)}
                    >
                      <Minus size={16} aria-hidden />
                    </button>
                    <output className="min-w-8 text-center text-sm" aria-label={`Quantity: ${qty}`}>{qty}</output>
                    <button
                      type="button"
                      aria-label={`Increase ${product.name} quantity`}
                      disabled={qty >= availableQuantity}
                      className="rounded p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setQty(lineId, qty + 1)}
                    >
                      <Plus size={16} aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    className="rounded p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                    onClick={() => remove(lineId)}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {detailed.length && !catalogError ? <aside className="w-full lg:w-[40%]">
        <div className="flex h-full w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white px-4 py-8 shadow-md">
          <h2 className="w-fit text-left text-2xl font-bold">Summary</h2>
          <div className="flex w-full flex-col items-start justify-between space-y-8">
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem]">Items in cart</p>
              <p className="text-[0.875rem] font-semibold">{lines.length}</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem]">Total quantity</p>
              <p className="text-[0.875rem] font-semibold">{count}</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem] font-semibold">Total</p>
              <p className="text-[0.875rem] font-semibold">{formatPrice(total)}</p>
            </div>
          </div>
          {checkoutReady ? (
            <AccentLink href="/checkout">Proceed to checkout</AccentLink>
          ) : (
            <AccentButton disabled>
              {invalidLines.length || stockIssueLines.length ? "Resolve unavailable items to continue" : "Checking availability…"}
            </AccentButton>
          )}
        </div>
      </aside> : null}
    </div>
  );
}
