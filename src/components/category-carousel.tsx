"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategoryCard } from "@/components/category-card";
import type { Category } from "@/lib/types";

export function CategoryCarousel({ categories }: { categories: Category[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element || categories.length < 3 || paused) return;
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
  }, [paused, categories.length]);

  function scroll(direction: -1 | 1) {
    const element = track.current;
    const firstCard = element?.firstElementChild;
    if (!element || !firstCard) return;
    element.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + 16),
      behavior: "smooth",
    });
  }

  if (!categories.length) return null;

  return (
    <section id="categories" className="glass-panel flex w-full flex-col rounded-xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-xl font-bold sm:text-2xl">Shop by Categories</h1>
        {categories.length > 2 ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Previous categories"
              onClick={() => scroll(-1)}
              className="rounded-full border border-white/60 bg-white/50 p-2 text-accent backdrop-blur-sm transition duration-200 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next categories"
              onClick={() => scroll(1)}
              className="rounded-full border border-white/60 bg-white/50 p-2 text-accent backdrop-blur-sm transition duration-200 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={track}
        className="scrollbar-hide mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
        aria-label="Shop by categories"
      >
        {categories.map((category) => (
          <div key={category.id} className="w-[42vw] min-w-[9.5rem] max-w-[16rem] shrink-0 snap-start sm:w-52">
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </section>
  );
}
