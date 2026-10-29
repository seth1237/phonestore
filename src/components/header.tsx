"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUser,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { exploreLinks } from "@/data/navigation";
import { groupCategories } from "@/lib/category-navigation";
import type { Category, Product, Site } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { CUSTOMER_EVENT, customerToken, logoutCustomer } from "@/lib/customer-session";
import { Price } from "./price";
import { apiFetch } from "@/lib/client-api";

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
      apiFetch(`/api/search?q=${encodeURIComponent(needle)}`)
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
      className={`border-line relative z-50 flex flex-1 flex-row items-center justify-between rounded-md border px-2 py-1.5 ${
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
        placeholder="Search products"
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
        className="flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-md bg-secondary text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Search size={20} strokeWidth={2} aria-hidden />
      </button>
      {show ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-[min(70vh,28rem)] w-full overflow-y-auto rounded-md border border-line bg-white shadow-lg">
          {categories.length === 0 && products.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No matching products</p>
          ) : null}
          {categories.map((category) => (
            <Link
              key={`cat-${category.id}`}
              href={`/category/${category.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-3 border-b border-line px-3 py-3 hover:bg-page"
            >
              <span className="text-sm font-semibold text-ink">{category.name}</span>
              <span className="text-xs text-muted">Category</span>
            </Link>
          ))}
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-b-0 hover:bg-page"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-page">
                {product.thumb ? (
                  <Image src={product.thumb} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                <span className="mt-1 block text-sm font-bold text-accent">
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
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={
        mobile
          ? "relative flex h-[3.13rem] w-[3.13rem] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          : "relative flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      }
    >
      <span
        aria-hidden="true"
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

function AccountIcon() {
  return (
    <Link
      href="/account"
      className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <CircleUser size={26} strokeWidth={2} aria-hidden />
      <span>Account</span>
    </Link>
  );
}

export function Header({ site, categories }: { site: Site; categories: Category[] }) {
  const categoryMenu = useRef<HTMLDivElement>(null);
  const mobileMenuPanel = useRef<HTMLDivElement>(null);
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
  const mobileMenuWasOpen = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const pathname = usePathname();
  const categoryGroups = groupCategories(categories);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const token = customerToken();
      if (!token) {
        if (!ignore) setSignedIn(false);
        return;
      }
      const response = await apiFetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        window.sessionStorage.removeItem("rai_customer_token");
        if (!ignore) setSignedIn(false);
        return;
      }
      if (!ignore) setSignedIn(true);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(CUSTOMER_EVENT, onChange);
    return () => {
      ignore = true;
      window.removeEventListener(CUSTOMER_EVENT, onChange);
    };
  }, [pathname]);

  async function logout() {
    await logoutCustomer(apiFetch);
    setSignedIn(false);
    setMenuOpen(false);
  }

  useEffect(() => {
    setMenuOpen(false);
    setCategoryMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!categoryMenu.current?.contains(event.target as Node)) setCategoryMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoryMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryMenuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      if (mobileMenuWasOpen.current) {
        mobileMenuWasOpen.current = false;
        mobileMenuTrigger.current?.focus();
      }
      return;
    }

    mobileMenuWasOpen.current = true;
    const panel = mobileMenuPanel.current;
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])') || []);
    focusable()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function toggleMobileGroup(label: string) {
    setExpandedMobileGroups((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
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
          <AccountIcon />
          <CartLink />
        </div>
        <div className="relative flex w-full items-center justify-center border-b-[3px] border-secondary bg-accent px-4">
          <div className="flex w-full max-w-screen-xl flex-row items-center justify-between gap-8 py-3">
            <div ref={categoryMenu} className="relative">
              <button
                type="button"
                aria-expanded={categoryMenuOpen}
                aria-controls="desktop-category-menu"
                onClick={() => setCategoryMenuOpen((open) => !open)}
                className="rounded px-3 py-2 text-sm font-bold text-white hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Shop by category
              </button>
              {categoryMenuOpen ? (
                <nav
                  id="desktop-category-menu"
                  aria-label="Product categories"
                  className="absolute left-0 top-full z-40 grid max-h-[70vh] w-[min(60rem,90vw)] grid-cols-2 gap-5 overflow-y-auto rounded-b-md bg-white p-5 text-ink shadow-2xl lg:grid-cols-3"
                >
                  {categoryGroups.map((group) => {
                    const directCategory = group.categories.length === 1 && group.categories[0].linkLabel === group.label;
                    const childCategories = group.categories.filter(
                      (category) => category.linkLabel.toLowerCase() !== group.label.toLowerCase(),
                    );
                    return (
                      <section key={group.label} className="min-w-0">
                        <Link
                          href={group.href}
                          onClick={() => setCategoryMenuOpen(false)}
                          className="block rounded px-2 py-1 text-sm font-bold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {directCategory ? group.label : `Browse all ${group.label}`}
                        </Link>
                        {directCategory ? null : (
                          <ul className="mt-1 space-y-1">
                            {childCategories.map((category) => (
                              <li key={category.id}>
                                <Link
                                  href={`/category/${category.slug}`}
                                  onClick={() => setCategoryMenuOpen(false)}
                                  className="block rounded px-2 py-1 text-sm text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                >
                                  {category.linkLabel}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </nav>
              ) : null}
            </div>
            <Link href="/contact" className="shrink-0 text-[0.875rem] font-bold whitespace-nowrap text-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="block w-full bg-white lg:hidden">
        <div className="flex w-full flex-row items-center justify-between px-4 py-3 font-rubik">
          <button ref={mobileMenuTrigger} type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
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
        <div className="relative z-40 overflow-visible border-b-[3px] border-secondary bg-accent px-4 py-4">
          <SearchField id="mobile-search" tone="onAccent" />
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div ref={mobileMenuPanel} className="absolute top-0 left-0 flex h-full w-[min(20.5rem,88vw)] flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-5">
              <p className="text-[1rem] font-bold">{site.name}</p>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col px-2 py-3" aria-label="Mobile">
              <Link href="/account" className="flex items-center gap-3 border-b border-line px-3 py-3 text-[0.875rem] font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent">
                <CircleUser size={20} aria-hidden /> Account
              </Link>
              {signedIn ? (
                <button type="button" className="flex items-center gap-3 border-b border-line px-3 py-3 text-left text-[0.875rem] font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent" onClick={() => void logout()}>
                  <LogOut size={20} aria-hidden /> Log out
                </button>
              ) : null}
              {categoryGroups.map((group) => {
                const directCategory = group.categories.length === 1 && group.categories[0].linkLabel === group.label;
                const childCategories = group.categories.filter(
                  (category) => category.linkLabel.toLowerCase() !== group.label.toLowerCase(),
                );
                if (directCategory) {
                  const category = group.categories[0];
                  return (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="border-b border-line px-3 py-3 text-[0.875rem] font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {category.name}
                    </Link>
                  );
                }
                const expanded = expandedMobileGroups.includes(group.label);
                const groupId = `mobile-category-${group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                return (
                  <section key={group.label} className="border-b border-line">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={groupId}
                      onClick={() => toggleMobileGroup(group.label)}
                      className="flex w-full items-center justify-between px-3 py-3 text-left text-[0.875rem] font-bold text-ink focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {group.label}
                      <span aria-hidden>{expanded ? "−" : "+"}</span>
                    </button>
                    {expanded ? (
                      <div id={groupId} className="bg-page px-3 pb-2">
                        <Link href={group.href} className="block py-2 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-accent">
                          Browse all {group.label}
                        </Link>
                        {childCategories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            className="block py-2 pl-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            {category.linkLabel}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
              <Link href="/contact" className="px-3 py-3 text-[0.875rem] font-bold text-secondary focus-visible:outline-2 focus-visible:outline-accent">
                Contact Us
              </Link>
            </nav>
            <div className="mt-auto space-y-2 border-t border-line px-5 py-5">
              {exploreLinks.filter((link) => link.href !== "/account").map((link) => (
                <Link key={link.href} href={link.href} className="block rounded py-1 text-[0.875rem] text-ink focus-visible:outline-2 focus-visible:outline-accent">
                  {link.label}
                </Link>
              ))}
              {site.phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="block rounded pt-2 text-[0.875rem] font-bold focus-visible:outline-2 focus-visible:outline-accent">
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
