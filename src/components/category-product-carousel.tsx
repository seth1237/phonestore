"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function CategoryProductCarousel({
  products,
  category,
}: {
  products: Product[];
  category: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element || products.length < 2 || paused) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const timer = window.setInterval(() => {
      const firstCard = element.firstElementChild;
      if (!firstCard) return;
      const distance = firstCard.getBoundingClientRect().width + 16;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 8;
      element.scrollTo({
        left: atEnd ? 0 : element.scrollLeft + distance,
        behavior: "smooth",
      });
    }, 3200);
    return () => window.clearInterval(timer);
  }, [paused, products.length]);

  function scroll(direction: -1 | 1) {
    const element = track.current;
    const firstCard = element?.firstElementChild;
    if (!element || !firstCard) return;
    element.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + 16),
      behavior: "smooth",
    });
  }

  if (!products.length) return null;

  return (
    <section className="w-full rounded-md bg-white px-4 py-8 shadow-md sm:px-6" aria-labelledby="same-category-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="same-category-title" className="text-xl font-bold sm:text-2xl">
            More in {category}
          </h2>
          <p className="mt-1 text-sm text-muted">Explore other products in this category.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Scroll to previous products"
            onClick={() => scroll(-1)}
            className="rounded-full border border-line p-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Scroll to more products"
            onClick={() => scroll(1)}
            className="rounded-full border border-line p-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="scrollbar-hide mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
        aria-label={`Products in ${category}`}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="w-[42vw] shrink-0 snap-start overflow-hidden rounded-md border border-line bg-white transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-48 lg:w-52"
          >
            <span className="relative block aspect-[5/6] w-full overflow-hidden bg-[#f3f4f6]">
              {(product.thumb || product.image) ? (
                <Image
                  src={product.thumb || product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 208px, 42vw"
                  className="object-cover object-center transition-transform duration-300 hover:scale-105"
                />
              ) : null}
            </span>
            <span className="block p-3">
              <span className="line-clamp-2 min-h-10 text-sm font-semibold text-accent">{product.name}</span>
              <span className="mt-2 block text-sm font-bold text-accent">{formatPrice(product.price)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
