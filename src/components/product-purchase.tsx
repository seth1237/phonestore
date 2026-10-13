"use client";

import Image from "next/image";
import { Minus, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { cartLineId, variantLabel, variantPhotos, variantPrice, variantStock, variantSwatch } from "@/lib/variants";
import { Price } from "./price";
import { AccentButton } from "./accent-button";
import { Breadcrumbs } from "./breadcrumbs";

export function ProductPurchase({ product }: { product: Product }) {
  const variants = product.variants || [];
  const colorKey = (item: { color: string; hex: string }) => item.color || item.hex;
  const colors = [...new Set(variants.map(colorKey).filter(Boolean))];
  const [color, setColor] = useState(colors[0] || "");
  const storages = variants.filter((item) => !color || colorKey(item) === color).map((item) => item.storage).filter(Boolean);
  const uniqueStorages = [...new Set(storages)];
  const [storage, setStorage] = useState(uniqueStorages[0] || "");
  const selected = variants.find((item) => colorKey(item) === color && item.storage === storage)
    || variants.find((item) => colorKey(item) === color)
    || variants[0]
    || null;
  const photos = variantPhotos(product, selected);
  const gallery = photos.length ? photos : product.image ? [{ url: product.image, thumb: product.thumb || product.image }] : [];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState("");
  const { add } = useCart();
  const current = gallery[Math.min(active, Math.max(gallery.length - 1, 0))];
  const price = variantPrice(product, selected);
  const stock = variantStock(product, selected);
  const inStock = stock > 0;
  const specRows = (() => {
    const rows = new Map<string, { label: string; value: string }>();
    for (const spec of [...(product.specs || []), ...(selected?.specs || [])]) {
      if (!spec.label || !spec.value) continue;
      rows.set(spec.label.toLowerCase(), spec);
    }
    return [...rows.values()];
  })();

  function chooseColor(next: string) {
    setColor(next);
    setActive(0);
    const options = variants.filter((item) => colorKey(item) === next);
    if (!options.some((item) => item.storage === storage)) setStorage(options.find((item) => item.storage)?.storage || "");
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        /* user dismissed */
      }
    }
    await navigator.clipboard.writeText(url);
    setNote("Link copied");
  }

  return (
    <div className="flex w-full flex-col gap-8">
    <div className="flex w-full flex-col items-start justify-start gap-8 lg:flex-row">
      <div className="w-full lg:w-[60%]">
        <div className="flex h-full w-full flex-col-reverse items-start justify-center space-y-[1.5rem] lg:flex-row lg:space-y-0 lg:space-x-[1rem]">
          <div className="flex w-full flex-row items-start justify-start space-x-2 overflow-x-auto rounded-md bg-white px-4 py-8 shadow-md lg:h-full lg:w-[20%] lg:flex-col lg:space-x-0 lg:space-y-4 lg:overflow-y-auto">
            {gallery.map((photo, index) => (
              <button
                key={photo.url}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                className={`h-[140px] w-[140px] shrink-0 overflow-hidden rounded-[0.5rem] border lg:w-full ${
                  index === active ? "border-secondary" : "border-transparent"
                }`}
              >
                <span className="relative block h-full w-full">
                  <Image src={photo.thumb || photo.url} alt={`${product.name} ${index + 1}`} fill sizes="140px" className="object-cover" />
                </span>
              </button>
            ))}
          </div>
          <div className="flex h-[20vh] min-h-[16rem] w-full flex-1 flex-col items-start justify-between rounded-md bg-white px-4 py-8 shadow-md lg:h-auto lg:min-h-[32rem] lg:w-[65%]">
            {current ? (
              <div className="relative h-full min-h-[14rem] w-full lg:min-h-[28rem]">
                <Image
                  src={current.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[40%]">
        <div className="flex min-h-[50vh] w-full flex-col items-start justify-between space-y-6 rounded-md bg-white px-4 py-8 shadow-md">
          <Breadcrumbs
            items={[
              { href: "/", label: "All Categories" },
              product.categoryId
                ? { href: `/category/${product.categorySlug || product.categoryId}`, label: product.category || "Category" }
                : { label: "Products" },
            ]}
          />
          <h1 className="text-[1.5rem] text-black lg:text-[2.5rem]">{product.name}</h1>
          <div className="text-[2rem] font-bold text-accent lg:text-[3rem]">
            <Price amount={price} />
          </div>
          {product.description ? <p className="text-[1rem] font-normal text-accent">{product.description}</p> : null}
          {colors.length ? (
            <div className="w-full">
              <p className="text-sm font-semibold text-accent">Choose your color</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {colors.map((item) => {
                  const chosen = item === color;
                  const match = variants.find((entry) => colorKey(entry) === item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => chooseColor(item)}
                      aria-label={item}
                      aria-pressed={chosen}
                      title={item}
                      className={`h-8 w-8 rounded-full border-2 ${chosen ? "border-[#EA580C] ring-2 ring-[#EA580C] ring-offset-2" : "border-white shadow"}`}
                      style={{ background: match ? variantSwatch(match) : "#d1d5db" }}
                    />
                  );
                })}
                {color ? <span className="text-sm font-semibold text-accent">{color}</span> : null}
              </div>
            </div>
          ) : null}
          {uniqueStorages.length ? (
            <div className="w-full">
              <p className="text-sm font-semibold text-accent">Storage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {uniqueStorages.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setStorage(item);
                      setActive(0);
                    }}
                    aria-pressed={item === storage}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                      item === storage ? "border-[#EA580C] text-accent" : "border-line text-accent"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {selected ? <p className="text-sm text-accent">{variantLabel(selected)}{selected.sku ? ` · ${selected.sku}` : ""}</p> : null}
          <div className="flex w-full flex-col items-start justify-start space-y-[1.5rem]">
            <div className="flex w-full flex-row items-center justify-between space-x-6">
              <div className="flex flex-row items-center justify-evenly divide-x divide-[#e5e7eb] rounded-md border border-line">
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="p-2 lg:p-4"
                  onClick={() => setQty((value) => value + 1)}
                >
                  <Plus size={27} />
                </button>
                <p className="min-w-10 px-2 text-center text-[1.5rem] font-medium lg:px-4 lg:text-[2rem]">{qty}</p>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="p-2 lg:p-4"
                  onClick={() => setQty((value) => Math.max(0, value - 1))}
                >
                  <Minus size={27} />
                </button>
              </div>
              <div className="w-fit lg:min-w-[10vw]">
                <AccentButton
                  disabled={!inStock}
                  onClick={() => {
                    if (!inStock) return;
                    add(cartLineId(product.id, selected?.id), Math.max(qty, 1));
                    setNote("Added to cart");
                  }}
                >
                  Add to cart
                </AccentButton>
              </div>
            </div>
            {note ? <p className="text-sm text-[#166534]">{note}</p> : null}
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[1rem] text-accent">
                <span className="font-semibold">Category: </span>
                {product.category || "General"}
              </p>
              <button type="button" onClick={share} className="flex flex-row items-center space-x-1">
                <Share2 size={15} aria-hidden />
                <span className="font-semibold">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {specRows.length ? (
      <section className="w-full rounded-md bg-white px-4 py-8 shadow-md sm:px-8">
        <h2 className="text-xl font-bold text-accent">Specifications</h2>
        <div className="mt-4 border-y border-[#e5e7eb]">
          {specRows.map((row) => (
            <div key={row.label} className="grid grid-cols-1 gap-1 border-b border-[#e5e7eb] py-4 last:border-b-0 sm:grid-cols-[220px_1fr] sm:gap-8">
              <p className="text-[15px] font-semibold text-[#111827]">{row.label}</p>
              <p className="text-[15px] font-normal text-[#4b5563]">{row.value}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null}
    </div>
  );
}
