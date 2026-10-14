"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: number;
  customer_name: string;
  phone: string;
  email: string;
  location: string;
  total: number;
  status: string;
  payment_status: string;
  mpesa_receipt: string;
  quotation_number: string | null;
  created_at: string;
  items: OrderItem[];
};

const labels: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  dispatched: "Dispatched",
  delivered: "Delivered",
  pending: "Pending",
  failed: "Failed",
};

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

  function load() {
    void apiFetch("/api/admin/orders")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Order[]) => setRows(data));
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function mark(id: number, status: "dispatched" | "delivered") {
    setMessage("");
    const response = await apiFetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setMessage(data?.error || "The order could not be updated.");
      return;
    }
    load();
  }

  return (
    <>
      <header className="admin-header"><h1>Orders</h1></header>
      {message ? <p className="admin-message">{message}</p> : null}
      <section className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>Customer</th><th>Items</th><th>Payment</th><th>Fulfillment</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b>{row.customer_name}</b>
                  <div>{row.phone}</div>
                  <div>{row.email}</div>
                  <div>{row.location}</div>
                </td>
                <td>
                  {row.items.map((item) => (
                    <div key={`${row.id}-${item.name}`}>{item.name} × {item.qty}</div>
                  ))}
                  <div><b>KSh {Number(row.total).toLocaleString("en-KE")}</b></div>
                </td>
                <td>
                  <div>{labels[row.payment_status] || row.payment_status}</div>
                  <div>{row.mpesa_receipt || "No receipt yet"}</div>
                  {row.quotation_number ? <div>Quote {row.quotation_number}</div> : null}
                </td>
                <td>
                  <div>{labels[row.status] || row.status}</div>
                  {row.payment_status === "paid" && row.status !== "dispatched" && row.status !== "delivered" ? (
                    <button type="button" className="mt-2 font-bold text-accent" onClick={() => void mark(row.id, "dispatched")}>Mark dispatched</button>
                  ) : null}
                  {row.status === "dispatched" ? (
                    <button type="button" className="mt-2 font-bold text-accent" onClick={() => void mark(row.id, "delivered")}>Mark delivered</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
