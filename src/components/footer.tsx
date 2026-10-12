"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPinned, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./icons";
import { exploreLinks } from "@/data/navigation";
import type { Category, Site } from "@/lib/types";

const CREDIT_HREF = "https://codewithseth.co.ke";
const CREDIT_LABEL = "codewithseth.co.ke";

export function Footer({ site, categories }: { site: Site; categories: Category[] }) {
  const links = categories.slice(0, 5);
  const social = [
    site.social.facebook ? { href: site.social.facebook, label: "Facebook", icon: "facebook" as const } : null,
    site.social.instagram ? { href: site.social.instagram, label: "Instagram", icon: "instagram" as const } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="mx-auto flex w-full flex-col items-center justify-center bg-footer px-4 py-8 lg:p-8">
      <div className="grid w-full max-w-screen-xl grid-cols-2 gap-x-4 gap-y-8 pb-6 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-0 lg:pb-4">
        {/* Brand / contact */}
        <div className="col-span-2 flex w-full flex-col items-center gap-4 text-center lg:w-[30%] lg:items-start lg:p-4 lg:text-left">
          <h2 className="text-[1rem] font-bold text-footer-text">{site.name}</h2>
          <p className="w-full max-w-md text-[0.75rem] leading-[1.5rem] font-normal text-footer-text lg:max-w-none">
            {site.footerBlurb}
          </p>
          <div className="flex w-full flex-col items-center gap-3 lg:items-start">
            <div className="flex flex-row items-start justify-center gap-3 lg:justify-start">
              <MapPinned size={14} stroke="#6b7280" aria-hidden className="mt-0.5 shrink-0" />
              <p className="max-w-xs text-[0.75rem] leading-5 text-footer-text">{site.address}</p>
            </div>
            {site.phones.map((phone) => (
              <div key={phone} className="flex flex-row items-center justify-center gap-3 lg:justify-start">
                <Phone size={14} stroke="#6b7280" aria-hidden className="shrink-0" />
                <a href={`tel:${phone}`} className="py-1 text-[0.75rem] text-footer-text">
                  {phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="flex w-full flex-col items-start gap-1 lg:w-fit lg:p-4">
          <p className="mb-2 w-full text-left text-[1rem] font-bold text-footer-text">Shop by category</p>
          {links.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="w-full shrink-0 py-1.5 text-left text-[0.75rem] text-footer-text capitalize hover:text-secondary"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* Explore */}
        <div className="flex w-full flex-col items-end gap-1 lg:w-fit lg:p-4">
          <p className="mb-2 w-full text-right text-[1rem] font-bold text-footer-text">Explore more</p>
          {exploreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-full shrink-0 py-1.5 text-right text-[0.75rem] text-footer-text capitalize hover:text-secondary"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
            className="w-full shrink-0 py-1.5 text-right text-[0.65rem] text-footer-text underline opacity-60 underline-offset-2 hover:text-secondary hover:opacity-100"
          >
            Cookie Settings
          </button>
        </div>

        {/* Social */}
        {social.length ? (
          <div className="col-span-2 flex w-full flex-col items-center gap-3 lg:w-fit lg:p-4">
            <p className="text-center text-[1rem] font-bold text-footer-text">Find us on:</p>
            <div className="flex flex-row items-center justify-center gap-8">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center"
                >
                  {item.icon === "facebook" ? (
                    <FacebookIcon size={24} stroke="#6b7280" />
                  ) : (
                    <InstagramIcon size={24} stroke="#6b7280" />
                  )}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Credit */}
      <div className="flex w-full max-w-screen-xl items-center justify-center border-t border-secondary/50 pt-6">
        <a
          href={CREDIT_HREF}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[0.75rem] text-footer-text hover:text-secondary"
        >
          <Image src="/smo.png" alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
          <span>
            Made by <span className="font-semibold">{CREDIT_LABEL}</span>
          </span>
        </a>
      </div>
    </footer>
  );
}