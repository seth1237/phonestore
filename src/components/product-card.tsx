"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import type { Product } from "@/lib/types";
import { defaultCartLineId } from "@/lib/variants";
import { Price } from "./price";

export function ProductCard({
  product,
  variant = "shelf",
}: {
  product: Product;
  variant?: "shelf" | "catalog";
}) {
  const { add } = useCart();
  const inStock = product.stock > 0;
  const src = product.thumb || product.image;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`border-line relative flex cursor-pointer flex-col items-start justify-start overflow-hidden rounded-md border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        variant === "catalog"
          ? "w-full"
          : "w-[9.5rem] flex-grow lg:w-[11.48rem] lg:flex-grow-0"
      }`}
    >
      <button
        type="button"
        aria-label={inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
        disabled={!inStock}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (inStock) add(defaultCartLineId(product), 1);
        }}
        className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary p-1 text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={20} strokeWidth={2} aria-hidden />
      </button>
      <div
        className="relative aspect-[5/6] w-full overflow-hidden bg-[#f3f4f6]"
      >
        {src ? (
          <Image
            src={src}
            alt={product.name}
            fill
            sizes={variant === "catalog" ? "(min-width: 1024px) 33vw, 50vw" : "(min-width: 1024px) 184px, 44vw"}
            className="object-cover object-center"
          />
        ) : null}
      </div>
      <div className="flex w-full flex-col items-start justify-between gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-accent">{product.name}</h3>
        <div className="text-base font-bold text-accent">
          <Price amount={product.price} />
        </div>
      </div>
    </Link>
  );
}
