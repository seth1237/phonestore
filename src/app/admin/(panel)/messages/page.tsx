"use client";

import { useEffect, useState } from "react";

type Message = { id: number; name: string; phone: string; email: string; message: string; created_at: string };

export default function AdminMessagesPage() {
  const [rows, setRows] = useState<Message[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/backend/api/admin/messages")
        .then((response) => (response.ok ? response.json() : []))
        .then((data: Message[]) => setRows(data));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <header className="admin-header"><h1>Messages</h1></header>
      <section className="admin-card">
        <table className="admin-table">
          <thead><tr><th>From</th><th>Message</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><b>{row.name}</b><div>{row.phone}</div><div>{row.email}</div></td>
                <td>{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
