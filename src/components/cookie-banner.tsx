"use client";

import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "promo-hub-cookies";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (!stored) setVisible(true);
    function open() {
      setVisible(true);
      setDetails(false);
    }
    window.addEventListener("open-cookie-settings", open);
    return () => window.removeEventListener("open-cookie-settings", open);
  }, []);

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-md bg-white px-5 py-4 text-left shadow-lg">
      <div className="flex items-center gap-2">
        <Cookie size={16} aria-hidden />
        <p className="text-sm font-bold text-ink">We use analytics cookies</p>
      </div>
      <p className="mt-2 text-[0.8rem] leading-5 text-[#4b5563]">
        We use cookies to understand how people use our site. No personal data is sold or shared with third parties.
      </p>
      <button
        type="button"
        className="mt-2 text-[0.8rem] text-[#374151] underline"
        aria-expanded={details}
        onClick={() => setDetails((value) => !value)}
      >
        See details
      </button>
      {details ? (
        <p className="mt-2 text-[0.8rem] leading-5 text-[#4b5563]">
          Analytics cookies remember anonymous visits so we can see which categories and products are useful. They are stored in this browser only. Decline keeps the shop fully usable.
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => choose("declined")}
          className="rounded-md border border-[#d1d5db] bg-white px-4 py-1.5 text-sm"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="rounded-md bg-secondary px-4 py-1.5 text-sm font-semibold text-white"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
