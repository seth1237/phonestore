"use client";

import { use, useEffect, useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { categoryDepartment } from "@/lib/category-navigation";
import { ProductCard } from "./product-card";
import { AccentButton } from "./accent-button";

const PRODUCTS_PAGE_SIZE = 21;

export function ProductsBrowser({
  searchParams,
  products,
  categories,
}: {
  searchParams: Promise<{ q?: string; department?: string }>;
  products: Product[];
  categories: Category[];
}) {
  const params = use(searchParams);
  const initialQuery = params.q ?? "";
  const [department, setDepartment] = useState((params.department ?? "").trim().toLowerCase());
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [visible, setVisible] = useState(PRODUCTS_PAGE_SIZE);
  const browseCategories = categories
    .filter((category) => category.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const all = products;

  useEffect(() => {
    setDepartment((params.department ?? "").trim().toLowerCase());
    setQuery(params.q ?? "");
    setVisible(PRODUCTS_PAGE_SIZE);
  }, [params.department, params.q]);
  const departmentCategories = useMemo(() => {
    if (!department) return null;
    return new Set(
      categories
        .filter((category) =>
          category.name.trim().toLowerCase() === department.replaceAll("-", " ") ||
          categoryDepartment(category.name)?.toLowerCase() === department.replaceAll("-", " "),
        )
        .map((category) => category.id),
    );
  }, [categories, department]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter((product) => {
      const matchesCategory = categoryId !== "all"
        ? product.categoryId === categoryId
        : !departmentCategories || departmentCategories.has(product.categoryId || "");
      const matchesQuery =
        needle.length < 3 ||
        `${product.name} ${product.category} ${product.description ?? ""}`.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [all, categoryId, departmentCategories, query]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-5 font-work lg:py-8">
      <div className="flex h-full w-full max-w-[1440px] flex-col items-start justify-center space-y-[1.5rem] px-4">
        <div className="flex w-full flex-col items-center justify-start space-y-[2.5rem] overflow-hidden">
          <div className="flex w-full flex-col items-start justify-start space-y-[1.5rem]">
            <div className="flex w-full flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <h1 className="text-[1.75rem] font-bold max-lg:sr-only">
                {department
                  ? `${department.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} products`
                  : "Products"}
              </h1>
              <label className="sr-only" htmlFor="catalog-search">
                Search products
              </label>
              <input
                id="catalog-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(PRODUCTS_PAGE_SIZE);
                }}
                placeholder="Type at least 3 characters to search..."
                className="w-full rounded-[0.5rem] border border-line px-4 py-3 text-[0.875rem] font-medium text-black placeholder:text-[#828F9D] lg:max-w-md"
              />
            </div>
            <div className="flex w-full flex-row items-center justify-between pb-[1.3rem] pr-3">
              <p className="text-[0.875rem] text-[#445D6A]">
                Showing {Math.min(shown.length, filtered.length)} of {filtered.length} results
              </p>
            </div>
            <aside className="flex w-full flex-row items-center justify-start">
              <h2 className="w-[10rem] shrink-0 text-[1rem] font-light text-[#06273A] lg:text-[1.25rem]">Browse by:</h2>
              <div className="flex w-full flex-row items-start justify-start space-x-[1rem] overflow-x-auto py-4 pr-10">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId("all");
                    setDepartment("");
                    setVisible(PRODUCTS_PAGE_SIZE);
                  }}
                  className={`shrink-0 p-1.5 text-[1rem] ${
                    categoryId === "all" ? "rounded-[0.25rem] border-[1.25px] border-secondary text-accent shadow-lg" : ""
                  }`}
                >
                  All Products
                </button>
                {browseCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(category.id);
                      setVisible(PRODUCTS_PAGE_SIZE);
                    }}
                    className={`shrink-0 p-1.5 text-[1rem] whitespace-nowrap ${
                      categoryId === category.id ? "rounded-[0.25rem] border-[1.25px] border-secondary text-accent shadow-lg" : ""
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </aside>
            {shown.length === 0 ? (
              <p className="w-full py-16 text-center font-inter text-2xl font-extrabold">No products to display</p>
            ) : (
              <div className="grid w-full grid-cols-2 gap-x-[1.5rem] gap-y-[4rem] lg:grid-cols-3">
                {shown.map((product) => (
                  <ProductCard key={product.id} product={product} variant="catalog" />
                ))}
              </div>
            )}
            {visible < filtered.length ? (
              <div className="mx-auto w-full max-w-xs pt-4">
                <AccentButton onClick={() => setVisible((value) => value + PRODUCTS_PAGE_SIZE)}>Load more</AccentButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
