"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { exploreLinks } from "@/data/navigation";
import type { Category, Product, Site } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { Price } from "./price";

function SearchField({
  id,
  tone = "plain",
}: {
  id: string;
  tone?: "plain" | "onAccent";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const show = open && query.trim().length >= 3;

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 3) {
      setProducts([]);
      setCategories([]);
      return;
    }
    const handle = window.setTimeout(() => {
      fetch(`/backend/api/search?q=${encodeURIComponent(needle)}`)
        .then((response) => (response.ok ? response.json() : { products: [], categories: [] }))
        .then((data: { products?: Product[]; categories?: Category[] }) => {
          setProducts(data.products ?? []);
          setCategories(data.categories ?? []);
        })
        .catch(() => {
          setProducts([]);
          setCategories([]);
        });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div
      ref={box}
      className={`border-line relative flex flex-1 flex-row items-center justify-between rounded-md border px-2 py-1.5 ${
        tone === "onAccent" ? "bg-white" : "bg-white"
      }`}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        value={query}
        placeholder="Start typing to search (min. 3 letters)"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && query.trim().length >= 3) {
            setOpen(false);
            router.push(`/products?q=${encodeURIComponent(query.trim())}`);
          }
          if (event.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-lg px-4 py-2 outline-none ring-0"
      />
      <button
        type="button"
        aria-label="Search"
        onClick={() => {
          if (query.trim().length >= 3) {
            setOpen(false);
            router.push(`/products?q=${encodeURIComponent(query.trim())}`);
          } else {
            setOpen(true);
          }
        }}
        className="flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-md bg-secondary text-white"
      >
        <Search size={20} strokeWidth={2} aria-hidden />
      </button>
      {show ? (
        <div className="absolute right-2 top-[11rem] z-40 grid max-h-[40vh] w-[95vw] grid-cols-2 divide-x divide-y divide-line overflow-y-auto rounded-b-md bg-white drop-shadow-2xl lg:right-0 lg:top-[3.5rem] lg:max-h-[40vh] lg:w-full lg:grid-cols-3">
          {categories.length === 0 && products.length === 0 ? (
            <p className="col-span-2 px-4 py-6 text-center text-sm text-muted lg:col-span-3">
              No matching products
            </p>
          ) : null}
          {categories.map((category) => (
            <Link
              key={`cat-${category.id}`}
              href={`/category/${category.slug}`}
              onClick={() => setOpen(false)}
              className="flex cursor-pointer flex-row items-center justify-between space-x-2 bg-[#f8fafc] px-4 py-2 transition-colors hover:bg-gray-100"
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">Category</span>
              <span className="text-right text-[0.75rem] font-semibold text-black">{category.name}</span>
            </Link>
          ))}
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              onClick={() => setOpen(false)}
              className="flex cursor-pointer flex-row items-start justify-between space-x-2 px-4 py-2 transition-colors hover:bg-gray-100"
            >
              <span className="relative h-[3rem] w-[3rem] shrink-0 overflow-hidden lg:h-[4.063rem] lg:w-[4.063rem]">
                {product.thumb ? (
                  <Image src={product.thumb} alt="" fill sizes="65px" className="object-cover" />
                ) : null}
              </span>
              <span className="flex flex-col items-end justify-start space-y-[1rem]">
                <span className="text-right text-[0.75rem] font-semibold text-black">{product.name}</span>
                <span className="text-[1rem] font-bold text-accent">
                  <Price amount={product.price} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      {open && query.trim().length > 0 && query.trim().length < 3 ? (
        <p className="absolute right-0 top-full z-40 mt-1 rounded-md bg-white px-3 py-2 text-xs text-muted shadow-md">
          Keep typing — search starts at 3 letters.
        </p>
      ) : null}
    </div>
  );
}

function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} items`}
      className={
        mobile
          ? "relative flex h-[3.13rem] w-[3.13rem] items-center justify-center rounded-full"
          : "relative flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-full bg-accent text-white"
      }
    >
      <span
        className={
          mobile
            ? "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-secondary text-[0.8rem] font-bold text-white"
            : "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-secondary bg-secondary text-[0.75rem] font-bold text-white"
        }
      >
        {count > 99 ? "99" : count}
      </span>
      <ShoppingCart size={mobile ? 30 : 20} strokeWidth={2} color={mobile ? "black" : "white"} aria-hidden />
    </Link>
  );
}

export function Header({ site, categories }: { site: Site; categories: Category[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function scrollNav(direction: number) {
    scroller.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <header className="w-full">
      <div className="hidden w-full lg:block">
        <div className="flex h-10 w-full items-center justify-center bg-accent px-4">
          <div className="flex w-full max-w-screen-xl flex-row items-center justify-between">
            <p className="text-[0.875rem] font-bold text-white">
              Call:{" "}
              {site.phones.map((phone, index) => (
                <span key={phone}>
                  {index > 0 ? " / " : null}
                  <a href={`tel:${phone}`} className="hover:underline">
                    {phone}
                  </a>
                </span>
              ))}
            </p>
            <p className="text-[0.875rem] font-bold text-white">{site.tagline}</p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-screen-xl flex-row items-center justify-between gap-8 bg-white px-4 py-3">
          <Link href="/" className="flex shrink-0 flex-row items-center">
            <Image
              src={site.logo}
              alt={`${site.name} logo`}
              width={300}
              height={100}
              quality={100}
              priority
              className="h-[50px] w-[150px] object-contain"
            />
          </Link>
          <SearchField id="desktop-search" />
          <CartLink />
        </div>
        <div className="relative flex w-full items-center justify-center border-b-[3px] border-secondary bg-accent px-4">
          <div className="flex w-full max-w-screen-xl flex-row items-center justify-between gap-8 py-3">
            <div className="relative flex w-[50vw] flex-1 items-center justify-start">
              <button
                type="button"
                aria-label="Scroll categories left"
                onClick={() => scrollNav(-1)}
                className="absolute left-0 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 md:flex"
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <nav
                ref={scroller}
                aria-label="Product categories"
                className="scrollbar-hide mask-fade-right flex flex-1 flex-row items-center justify-start divide-x divide-white overflow-x-auto scroll-smooth px-8"
              >
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="shrink-0 px-[1rem] text-[0.875rem] font-bold whitespace-nowrap text-white hover:text-secondary"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                aria-label="Scroll categories right"
                onClick={() => scrollNav(1)}
                className="absolute right-0 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 md:flex"
              >
                <ChevronRight size={20} aria-hidden />
              </button>
            </div>
            <Link href="/contact" className="shrink-0 text-[0.875rem] font-bold whitespace-nowrap text-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="block w-full bg-white lg:hidden">
        <div className="flex w-full flex-row items-center justify-between px-4 py-3 font-rubik">
          <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Menu size={28} strokeWidth={2} />
          </button>
          <Link href="/" className="flex items-center">
            <Image
              src={site.logo}
              alt={`${site.name} logo`}
              width={300}
              height={100}
              quality={100}
              className="h-[32px] w-[96px] object-contain"
            />
          </Link>
          <CartLink mobile />
        </div>
        <div className="w-full border-b-[3px] border-secondary bg-accent px-4 py-4">
          <SearchField id="mobile-search" tone="onAccent" />
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 left-0 flex h-full w-[min(20.5rem,88vw)] flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-5">
              <p className="text-[1rem] font-bold">{site.name}</p>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col px-2 py-3" aria-label="Mobile">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="border-b border-line px-3 py-3 text-[0.875rem] font-bold text-ink"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/contact" className="px-3 py-3 text-[0.875rem] font-bold text-secondary">
                Contact Us
              </Link>
            </nav>
            <div className="mt-auto space-y-2 border-t border-line px-5 py-5">
              {exploreLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block py-1 text-[0.875rem] text-ink">
                  {link.label}
                </Link>
              ))}
              {site.phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="block pt-2 text-[0.875rem] font-bold">
                  Call: {phone}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
