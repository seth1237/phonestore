"use client";

import Link from "next/link";
import { MapPinned, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./icons";
import { exploreLinks } from "@/data/navigation";
import type { Category, Site } from "@/lib/types";

export function Footer({ site, categories }: { site: Site; categories: Category[] }) {
  const links = categories.slice(0, 5);
  const social = [
    site.social.facebook ? { href: site.social.facebook, label: "Facebook", icon: "facebook" as const } : null,
    site.social.instagram ? { href: site.social.instagram, label: "Instagram", icon: "instagram" as const } : null,
  ].filter((item) => item !== null);

  return (
    <footer className="mx-auto flex w-full flex-col items-center justify-center bg-footer p-4 lg:p-8">
      <div className="flex w-full max-w-screen-xl flex-col items-start justify-center pb-4 lg:flex-row lg:justify-between">
        <div className="flex w-full flex-col items-center justify-center gap-y-2 space-y-[1.5rem] p-4 lg:w-[30%] lg:items-start">
          <h2 className="text-[1rem] font-bold text-footer-text">{site.name}</h2>
          <p className="w-full text-center text-[0.75rem] leading-[1.5rem] font-normal text-footer-text lg:text-left">
            {site.footerBlurb}
          </p>
          <div className="flex w-full flex-col items-center justify-start space-y-[1rem] lg:items-start">
            <div className="flex flex-row items-center space-x-[1rem]">
              <MapPinned size={10} stroke="#6b7280" aria-hidden />
              <p className="max-w-xs text-[0.75rem] leading-5 text-footer-text">{site.address}</p>
            </div>
            {site.phones.map((phone) => (
              <div key={phone} className="flex flex-row items-center space-x-[1rem]">
                <Phone size={10} stroke="#6b7280" aria-hidden />
                <a href={`tel:${phone}`} className="text-[0.75rem] text-footer-text">
                  {phone}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-col justify-start space-y-[1rem] p-4 text-center lg:w-fit lg:items-start">
          <p className="w-full text-center text-[1rem] font-bold text-footer-text lg:text-left">Shop by category</p>
          {links.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="w-full shrink-0 text-[0.75rem] text-footer-text capitalize hover:text-secondary"
            >
              {category.name}
            </Link>
          ))}
        </div>
        <div className="flex w-full flex-col justify-start space-y-[1rem] p-4 lg:w-fit lg:items-end">
          <p className="w-full text-center text-[1rem] font-bold text-footer-text lg:text-end">Explore more</p>
          {exploreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-full shrink-0 text-center text-[0.75rem] text-footer-text capitalize hover:text-secondary lg:text-end"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
            className="w-full shrink-0 text-center text-[0.65rem] text-footer-text underline opacity-60 underline-offset-2 hover:text-secondary hover:opacity-100 lg:text-end"
          >
            Cookie Settings
          </button>
        </div>
        {social.length ? (
          <div className="flex w-full flex-col items-center justify-start space-y-2.5 p-4 lg:w-fit">
            <p className="text-left text-[1rem] font-bold text-footer-text">Find us on:</p>
            <div className="flex flex-row items-center justify-between space-x-[2.81rem] lg:justify-start">
              {social.map((item) => (
                <a key={item.label} href={item.href} aria-label={item.label} target="_blank" rel="noreferrer">
                  {item.icon === "facebook" ? <FacebookIcon size={24} stroke="#6b7280" /> : <InstagramIcon size={24} stroke="#6b7280" />}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {site.credit.label ? (
        <div className="flex w-[95vw] items-center justify-center border-t border-secondary/50 py-8">
          <a href={site.credit.href} target="_blank" rel="noreferrer" className="text-[0.75rem] text-footer-text">
            {site.credit.label}
          </a>
        </div>
      ) : null}
    </footer>
  );
}
