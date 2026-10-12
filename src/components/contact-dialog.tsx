"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AccentButton } from "./accent-button";

export function ContactDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="contact-title">
      <button className="absolute inset-0" aria-label="Close contact form" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-md bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="contact-title" className="text-[1rem] font-bold uppercase text-[#15171A]">
            Contact us
          </h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {sent ? (
          <p className="text-sm leading-6" role="status">
            Message received. We will call you back on the phone you shared.
          </p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              const response = await fetch("/backend/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: form.get("name"),
                  phone: form.get("phone"),
                  email: form.get("email"),
                  message: form.get("message"),
                }),
              });
              if (!response.ok) {
                setError("The message could not be saved. Call the shop instead.");
                return;
              }
              setSent(true);
            }}
          >
            <label className="block text-[0.8rem] font-semibold" htmlFor="contact-name">
              Full name
            </label>
            <input id="contact-name" required name="name" className="w-full rounded-md border border-line px-3 py-2.5 text-sm" />
            <label className="block text-[0.8rem] font-semibold" htmlFor="contact-phone">
              Phone
            </label>
            <input id="contact-phone" required name="phone" type="tel" className="w-full rounded-md border border-line px-3 py-2.5 text-sm" />
            <label className="block text-[0.8rem] font-semibold" htmlFor="contact-email">
              Email
            </label>
            <input id="contact-email" required name="email" type="email" className="w-full rounded-md border border-line px-3 py-2.5 text-sm" />
            <label className="block text-[0.8rem] font-semibold" htmlFor="contact-message">
              Message
            </label>
            <textarea id="contact-message" required name="message" className="min-h-28 w-full rounded-md border border-line px-3 py-2.5 text-sm" />
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <AccentButton type="submit">Send message</AccentButton>
          </form>
        )}
      </div>
    </div>
  );
}
