"use client";

import { useEffect, useState } from "react";
import type { Offer } from "@/lib/types";

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);

  async function load() {
    const response = await fetch("/backend/api/admin/offers");
    if (response.ok) setOffers(await response.json());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function toggle(offer: Offer) {
    await fetch(`/backend/api/admin/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !offer.paused }),
    });
    await load();
  }

  return (
    <>
      <header className="admin-header"><h1>Offers</h1></header>
      <section className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Offer</th><th>Until</th><th></th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td><b>{offer.title}</b><div>{offer.description}</div></td>
                <td>{offer.validUntil.slice(0, 10)}</td>
                <td><button type="button" className="button button-quiet" onClick={() => toggle(offer)}>{offer.paused ? "Resume" : "Pause"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
