"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AccentLink } from "@/components/accent-button";
import { Price } from "@/components/price";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { detailed, setQty, remove, count, total } = useCart();
  const quantity = detailed.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="flex h-full w-full flex-col items-start justify-start space-y-8 px-4 py-8 lg:flex-row lg:space-y-[2rem] lg:space-x-[2rem]">
      <section className="flex w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white px-4 py-8 shadow-md">
        <h1 className="w-fit text-left text-2xl font-bold">Cart</h1>
        {detailed.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-5">
              <p className="text-center font-inter text-xl font-bold">You currently have no items in your cart</p>
              <div className="mb-10 w-fit">
                <AccentLink href="/products" className="w-auto px-6">
                  RETURN TO SHOP
                </AccentLink>
              </div>
            </div>
          </div>
        ) : (
          <ul className="flex w-full flex-col gap-4">
            {detailed.map(({ lineId, product, qty, price, label, thumb }) => (
              <li key={lineId} className="flex w-full flex-row items-center gap-4 border-b border-line pb-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#f3f4f6]">
                  {thumb ? (
                    <Image src={thumb} alt="" fill sizes="80px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{product.name}</p>
                  {label ? <p className="text-xs text-muted">{label}</p> : null}
                  <p className="text-sm font-bold text-accent">
                    <Price amount={price} />
                  </p>
                </div>
                <div className="flex items-center rounded-md border border-line">
                  <button type="button" aria-label="Decrease" className="p-2" onClick={() => setQty(lineId, qty - 1)}>
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center text-sm">{qty}</span>
                  <button type="button" aria-label="Increase" className="p-2" onClick={() => setQty(lineId, qty + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <button type="button" aria-label={`Remove ${product.name}`} onClick={() => remove(lineId)}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside className="w-full lg:w-[40%]">
        <div className="flex h-full w-full flex-col items-start justify-evenly space-y-8 rounded-md bg-white px-4 py-8 shadow-md">
          <h2 className="w-fit text-left text-2xl font-bold">Summary</h2>
          <div className="flex w-full flex-col items-start justify-between space-y-8">
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem]">Total Items</p>
              <p className="text-[0.875rem] font-semibold">{count}</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem]">Total Quantity</p>
              <p className="text-[0.875rem] font-semibold">{quantity}</p>
            </div>
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[0.875rem] font-semibold">Total</p>
              <p className="text-[0.875rem] font-semibold">{formatPrice(total)}</p>
            </div>
          </div>
          <AccentLink href="/checkout">PROCEED TO CHECKOUT</AccentLink>
        </div>
      </aside>
    </div>
  );
}
