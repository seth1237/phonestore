"use client";

import { useMemo, useState } from "react";
import type { Offer } from "@/lib/types";

function isCurrent(offer: Offer, now: number) {
  if (offer.paused) return false;
  return new Date(offer.validFrom).getTime() <= now && new Date(offer.validUntil).getTime() >= now;
}

export function OffersBoard({ offers }: { offers: Offer[] }) {
  const [filter, setFilter] = useState("active");
  const now = Date.now();
  const visible = useMemo(() => {
    if (filter === "past") return offers.filter((offer) => !isCurrent(offer, now));
    if (filter === "all") return offers;
    return offers.filter((offer) => isCurrent(offer, now));
  }, [filter, now, offers]);

  return (
    <main className="flex min-h-screen w-full max-w-[1440px] flex-col items-start justify-center space-y-[1.5rem] px-4">
      <div className="flex h-full w-full flex-col items-center justify-start space-y-[2.5rem]">
        <div className="flex w-full flex-col items-start justify-start space-y-[1.5rem] px-4">
          <h1 className="w-full text-[1.75rem] font-bold max-lg:sr-only">All Offers</h1>
          <div className="flex w-full flex-row items-center justify-between pb-[1.3rem] pr-3">
            <p className="text-[0.875rem] text-[#445D6A]">{visible.length} offers</p>
            <label className="sr-only" htmlFor="offer-filter">
              Select a filter
            </label>
            <select
              id="offer-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="flex h-10 items-center rounded-md border border-line bg-white px-3 text-sm"
            >
              <option value="active">Select a filter</option>
              <option value="all">All offers</option>
              <option value="past">Past offers</option>
            </select>
          </div>
          {visible.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center justify-center space-y-10 py-16">
                <p className="font-inter text-2xl font-extrabold">No offers to display</p>
              </div>
            </div>
          ) : (
            <div className="grid w-full gap-6 md:grid-cols-2">
              {visible.map((offer) => (
                <article key={offer.id} className="rounded-md bg-white p-6 shadow-md">
                  <p className="text-[0.75rem] font-bold tracking-wide text-secondary uppercase">Offer</p>
                  <h2 className="mt-2 text-2xl font-bold">{offer.title}</h2>
                  <p className="mt-3 text-[0.95rem] leading-7 text-[#374151]">{offer.description}</p>
                  <p className="mt-4 text-[0.8rem] text-muted">
                    {new Date(offer.validFrom).toLocaleDateString()} – {new Date(offer.validUntil).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
