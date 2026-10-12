import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-lg"
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#f3f4f6]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 30vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      <h3 className="px-3 py-3 text-center text-sm font-semibold leading-tight text-ink">{category.name}</h3>
    </Link>
  );
}
