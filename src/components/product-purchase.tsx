"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product, Site } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { cartLineId, defaultVariant, variantLabel, variantPhotos, variantPrice, variantStock, variantSwatch } from "@/lib/variants";
import { Price } from "./price";
import { AccentButton } from "./accent-button";
import { Breadcrumbs } from "./breadcrumbs";

export function ProductPurchase({ product, site }: { product: Product; site: Site }) {
  const variants = product.variants || [];
  const colorKey = (item: { color: string; hex: string }) => item.color || item.hex;
  const colors = [...new Set(variants.map(colorKey).filter(Boolean))];
  const initialVariant = defaultVariant(product);
  const [color, setColor] = useState((initialVariant && colorKey(initialVariant)) || colors[0] || "");
  const storages = variants.filter((item) => !color || colorKey(item) === color).map((item) => item.storage).filter(Boolean);
  const uniqueStorages = [...new Set(storages)];
  const [storage, setStorage] = useState(initialVariant?.storage || uniqueStorages[0] || "");
  const selected = variants.find((item) => colorKey(item) === color && item.storage === storage)
    || variants.find((item) => colorKey(item) === color)
    || variants[0]
    || null;
  const photos = variantPhotos(product, selected);
  const gallery = photos.length ? photos : product.image ? [{ url: product.image, thumb: product.thumb || product.image }] : [];
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const { add } = useCart();
  const current = gallery[Math.min(active, Math.max(gallery.length - 1, 0))];
  const price = variantPrice(product, selected);
  const stock = variantStock(product, selected);
  const maxQuantity = Math.max(0, Math.floor(stock));
  const inStock = maxQuantity > 0;
  const specRows = (() => {
    const rows = new Map<string, { label: string; value: string }>();
    for (const spec of [...(product.specs || []), ...(selected?.specs || [])]) {
      if (!spec.label || !spec.value) continue;
      rows.set(spec.label.toLowerCase(), spec);
    }
    return [...rows.values()];
  })();

  useEffect(() => {
    setQty((value) => Math.min(Math.max(value, 1), Math.max(maxQuantity, 1)));
  }, [maxQuantity]);

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
          <p className="text-[1rem] leading-7 text-accent">
            {product.description || "No product description has been provided by the shop."}
          </p>
          <p className={`text-sm font-semibold ${inStock ? "text-[#166534]" : "text-[#991b1b]"}`} role="status">
            {inStock ? `In stock — ${maxQuantity} available` : "Out of stock"}
          </p>
          {colors.length ? (
            <fieldset className="w-full">
              <legend className="text-sm font-semibold text-accent">Choose your color</legend>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {colors.map((item) => {
                  const chosen = item === color;
                  const match = variants.find((entry) => colorKey(entry) === item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => chooseColor(item)}
                      aria-label={`Choose color ${item}`}
                      aria-pressed={chosen}
                      title={item}
                      className={`h-8 w-8 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${chosen ? "border-[#EA580C] ring-2 ring-[#EA580C] ring-offset-2" : "border-white shadow"}`}
                      style={{ background: match ? variantSwatch(match) : "#d1d5db" }}
                    />
                  );
                })}
                {color ? <span className="text-sm font-semibold text-accent">{color}</span> : null}
              </div>
            </fieldset>
          ) : null}
          {uniqueStorages.length ? (
            <fieldset className="w-full">
              <legend className="text-sm font-semibold text-accent">Storage</legend>
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
                    className={`rounded-md border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      item === storage ? "border-[#EA580C] text-accent" : "border-line text-accent"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          {selected ? <p className="text-sm text-accent">{variantLabel(selected)}{selected.sku ? ` · ${selected.sku}` : ""}</p> : null}
          <div className="flex w-full flex-col items-start justify-start space-y-[1.5rem]">
            <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="product-quantity" className="text-sm font-semibold text-accent">
                  Quantity
                </label>
                <div className="flex flex-row items-center divide-x divide-[#e5e7eb] rounded-md border border-line">
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="rounded p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 lg:p-3"
                    disabled={!inStock || qty >= maxQuantity}
                    onClick={() => setQty((value) => Math.min(maxQuantity, value + 1))}
                  >
                    <Plus size={22} aria-hidden />
                  </button>
                  <input
                    id="product-quantity"
                    type="number"
                    min={1}
                    max={maxQuantity || undefined}
                    step={1}
                    value={qty}
                    disabled={!inStock}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (Number.isFinite(value)) setQty(Math.min(maxQuantity, Math.max(1, Math.floor(value))));
                    }}
                    className="w-16 border-0 px-1 py-2 text-center text-lg font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-white"
                  />
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="rounded p-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 lg:p-3"
                    disabled={!inStock || qty <= 1}
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                  >
                    <Minus size={22} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="w-full sm:w-fit lg:min-w-[10vw]">
                <AccentButton
                  disabled={!inStock}
                  onClick={() => {
                    if (!inStock || qty < 1 || qty > maxQuantity) {
                      setNote("Choose a quantity available in stock.");
                      return;
                    }
                    add(cartLineId(product.id, selected?.id), qty);
                    setNote("Added to cart");
                  }}
                >
                  Add {qty} to cart
                </AccentButton>
              </div>
            </div>
            {note ? (
              <p className={`text-sm ${note === "Added to cart" ? "text-[#166534]" : "text-[#991b1b]"}`} role="status">
                {note}
              </p>
            ) : null}
            {site.phones[0] ? (
              <p className="text-sm text-accent">
                Need help with availability or details?{" "}
                <a
                  className="font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  href={`tel:${site.phones[0]}`}
                >
                  Call {site.phones[0]}
                </a>
              </p>
            ) : (
              <Link
                href="/contact"
                className="text-sm font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Ask us about this product
              </Link>
            )}
            <div className="flex w-full flex-row items-center justify-between">
              <p className="text-[1rem] text-accent">
                <span className="font-semibold">Category: </span>
                {product.category || "General"}
              </p>
              <button
                type="button"
                onClick={share}
                className="flex flex-row items-center space-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Share2 size={15} aria-hidden />
                <span className="font-semibold">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
      <section className="w-full rounded-md bg-white px-4 py-8 shadow-md sm:px-8">
        <h2 className="text-xl font-bold text-accent">Specifications</h2>
        {specRows.length ? (
          <div className="mt-4 border-y border-[#e5e7eb]">
            {specRows.map((row) => (
              <div key={row.label} className="grid grid-cols-1 gap-1 border-b border-[#e5e7eb] py-4 last:border-b-0 sm:grid-cols-[220px_1fr] sm:gap-8">
                <p className="text-[15px] font-semibold text-[#111827]">{row.label}</p>
                <p className="text-[15px] font-normal text-[#4b5563]">{row.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Specifications have not been provided for this product.</p>
        )}
      </section>
    </div>
  );
}
