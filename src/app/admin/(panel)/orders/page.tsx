"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  email: string;
  total: number;
  quotation_number: string | null;
  created_at: string;
};

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/backend/api/admin/orders")
        .then((response) => (response.ok ? response.json() : []))
        .then((data: Order[]) => setRows(data));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <header className="admin-header"><h1>Quotations</h1></header>
      <section className="admin-card">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Quotation</th><th>Total</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><b>{row.customer_name}</b><div>{row.phone}</div><div>{row.email}</div></td>
                <td>{row.quotation_number || "—"}</td>
                <td>{Number(row.total).toLocaleString("en-KE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
