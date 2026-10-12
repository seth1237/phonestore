"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  const images = category.images?.length ? category.images : category.image ? [category.image] : [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [images.length]);

  const current = images[index] || "";

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-lg"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#f3f4f6]">
        {current ? (
          <Image
            key={current}
            src={current}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 30vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
        {images.length > 1 ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
            {index + 1}/{images.length}
          </span>
        ) : null}
      </div>
      <h3 className="px-3 py-3 text-center text-sm font-semibold leading-tight text-accent">{category.name}</h3>
      <p className="px-3 pb-3 text-center text-xs text-muted">
        {category.count} {category.count === 1 ? "product" : "products"}
      </p>
    </Link>
  );
}
