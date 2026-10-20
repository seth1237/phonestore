"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { ContactDialog } from "@/components/contact-dialog";
import { FacebookIcon, InstagramIcon } from "@/components/icons";
import { formatHours, mapsDirectionsUrl, mapsEmbedUrl } from "@/lib/format";
import type { Site } from "@/lib/types";

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export function ContactBoard({ site }: { site: Site }) {
  const today = days[new Date().getDay()];
  const [day, setDay] = useState<(typeof days)[number]>(today);
  const [open, setOpen] = useState(false);
  const hours = site.popularHours[day] ?? [];
  const peak = Math.max(...hours, 1);
  const chartHours = hours
    .map((value, index) => ({ hour: index, value }))
    .filter((item) => item.hour >= 8 && item.hour <= 18);
  const social = [
    site.social.facebook ? { href: site.social.facebook, label: "Facebook" } : null,
    site.social.instagram ? { href: site.social.instagram, label: "Instagram" } : null,
    site.social.website ? { href: site.social.website, label: "Website" } : null,
  ].filter((item) => item !== null);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-5 font-rubik lg:py-8">
      <main className="flex h-full w-full max-w-[1440px] flex-col items-start justify-center space-y-[1.5rem] rounded-2xl p-4 lg:flex-row lg:space-y-0 lg:space-x-20">
        <div className="flex w-full flex-col space-y-[2.5rem] lg:w-[45%]">
          <h1 className="text-2xl font-bold text-[#15171A]">Contact {site.name}</h1>
          {social.length ? (
            <div className="flex w-full flex-col items-start justify-start pb-[1.5rem]">
              <h2 className="pb-[1.5rem] text-[1rem] font-bold uppercase text-[#15171A]">Find us on:</h2>
              <div className="flex w-full flex-row justify-start space-x-[2.5rem]">
                {social.map((item) => (
                  <a key={item.label} href={item.href} aria-label={item.label} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] text-[#354250]">
                    {item.label === "Facebook" ? <FacebookIcon size={22} /> : null}
                    {item.label === "Instagram" ? <InstagramIcon size={22} /> : null}
                    {item.label === "Website" ? <Globe size={22} /> : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          <div className="h-[45vh] w-full space-y-[1rem]">
            <h2 className="text-[1rem] font-extrabold uppercase text-[#15171A]">Locate us</h2>
            <iframe
              title={`Map of ${site.address}`}
              src={mapsEmbedUrl(site.coordinates.lat, site.coordinates.lng)}
              className="h-[40vh] w-full rounded-md border border-line"
            />
          </div>
          <div className="mt-10 flex w-full flex-col items-start space-y-[1.5rem]">
            <h2 className="text-[1rem] font-extrabold uppercase text-[#15171A]">Popular Times</h2>
            <div className="flex w-full flex-row justify-between">
              {days.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDay(label)}
                  aria-label={`Show popular times for ${label}`}
                  aria-pressed={day === label}
                  className={`pb-[0.27rem] text-[0.6875rem] font-bold uppercase text-[#5E5E5E] ${
                    day === label ? "border-b-[0.1875rem] border-secondary text-accent" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-full rounded-lg border border-line bg-white text-ink shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="text-2xl font-semibold leading-none tracking-tight">{day}</div>
                <div className="text-sm text-muted">Typical visits through the day</div>
              </div>
              <div className="p-6 pt-0">
                <div className="flex aspect-video items-end justify-between gap-1">
                  {chartHours.map((item) => (
                    <div key={item.hour} className="flex h-full flex-1 flex-col items-center justify-end">
                      <div
                        className="w-full rounded-t bg-secondary"
                        style={{ height: `${Math.max(4, (item.value / peak) * 100)}%` }}
                        title={`${item.hour}:00`}
                      />
                      <span className="mt-1 text-[0.6rem] text-muted">{item.hour}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 p-6 pt-0 text-sm">
                <p className="leading-none text-muted">Represents how busy the business typically is during each hour.</p>
              </div>
            </div>
          </div>
          <AccentButton onClick={() => setOpen(true)}>Contact Us</AccentButton>
        </div>
        <div className="flex w-full flex-col space-y-[1rem] lg:w-[40%]">
          <div className="w-full space-y-[1rem] py-[2.5rem] lg:pt-0">
            <h2 className="pb-[1rem] text-[1rem] font-bold uppercase text-[#15171A]">Our Address</h2>
            <p className="text-[0.9375rem] font-medium text-[#15171A]">{site.address}</p>
            <div className="flex flex-col gap-1">
              {site.phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="text-[0.9375rem] font-semibold text-accent">
                  {phone}
                </a>
              ))}
            </div>
            <AccentLink href={mapsDirectionsUrl(site.coordinates.lat, site.coordinates.lng)} className="w-full">
              Get Directions
            </AccentLink>
          </div>
          <div className="flex w-full items-center justify-start py-[1.5rem]">
            <div>
              <h2 className="pb-[1.5rem] text-[1rem] font-bold uppercase text-[#15171A]">Opening Hours</h2>
              <div className="flex w-full flex-col justify-start">
                {site.hours.map((slot) => (
                  <div key={slot.day} className="flex flex-row pb-[0.4rem]">
                    <p className="w-24">{slot.day}</p>
                    <p className="font-medium">{formatHours(slot.open, slot.close)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {site.email || site.whatsapp ? (
            <p className="text-sm text-[#354250]">
              {site.email ? (
                <>
                  Email <a className="font-semibold underline" href={`mailto:${site.email}`}>{site.email}</a>
                </>
              ) : null}
              {site.email && site.whatsapp ? " · " : null}
              {site.whatsapp ? <>WhatsApp {site.whatsapp}</> : null}
            </p>
          ) : null}
        </div>
      </main>
      <ContactDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
