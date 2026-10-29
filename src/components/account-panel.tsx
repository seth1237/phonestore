"use client";

import { useEffect, useState } from "react";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { apiFetch } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import { CUSTOMER_EVENT, clearCustomerToken, customerToken, logoutCustomer, setCustomerToken } from "@/lib/customer-session";

type Customer = { id: number; name: string; email: string; phone: string };
type OrderItem = { name: string; qty: number; price: number };
type AccountOrder = {
  id: number;
  total: number;
  status: string;
  payment_status: string;
  mpesa_receipt: string;
  location: string;
  created_at: string;
  items: OrderItem[];
};

const labels: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  dispatched: "Dispatched",
  delivered: "Delivered",
  failed: "Payment failed",
  pending: "Payment pending",
};

function statusLabel(status: string) {
  return labels[status] || status;
}

export function AccountPanel() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function loadOrders(token: string) {
    const response = await apiFetch("/api/account/orders", { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    setOrders((await response.json()) as AccountOrder[]);
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      const token = customerToken();
      if (!token) {
        if (!ignore) {
          setCustomer(null);
          setOrders([]);
          setReady(true);
        }
        return;
      }
      const response = await apiFetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        clearCustomerToken();
        if (!ignore) {
          setCustomer(null);
          setOrders([]);
          setReady(true);
        }
        return;
      }
      const data = (await response.json()) as { customer: Customer };
      if (ignore) return;
      setCustomer(data.customer);
      await loadOrders(token);
      setReady(true);
    }
    void load();
    window.addEventListener(CUSTOMER_EVENT, load);
    return () => {
      ignore = true;
      window.removeEventListener(CUSTOMER_EVENT, load);
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const path = mode === "login" ? "/api/account/login" : "/api/account/register";
    const response = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
      }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; token?: string; customer?: Customer } | null;
    if (!response.ok || !data?.token || !data.customer) {
      setError(data?.error || "The account could not be opened.");
      return;
    }
    setCustomerToken(data.token);
    setCustomer(data.customer);
    await loadOrders(data.token);
  }

  async function logout() {
    await logoutCustomer(apiFetch);
    setCustomer(null);
    setOrders([]);
  }

  if (!ready) return <p className="px-4 py-16 text-sm text-muted">Loading your account…</p>;

  if (!customer) {
    return (
      <form className="mx-auto w-full max-w-md space-y-4 px-4 py-12" onSubmit={submit}>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Sign in" : "Create an account"}</h1>
        {mode === "register" ? (
          <>
            <label className="block text-sm font-semibold" htmlFor="account-name">Full name</label>
            <input id="account-name" name="name" required className="w-full rounded-md border border-line px-3 py-3 text-sm" />
            <label className="block text-sm font-semibold" htmlFor="account-phone">Phone</label>
            <input id="account-phone" name="phone" type="tel" className="w-full rounded-md border border-line px-3 py-3 text-sm" />
          </>
        ) : null}
        <label className="block text-sm font-semibold" htmlFor="account-email">Email</label>
        <input id="account-email" name="email" type="email" required className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="account-password">Password</label>
        <input id="account-password" name="password" type="password" required minLength={8} className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <AccentButton type="submit">{mode === "login" ? "Sign in" : "Create account"}</AccentButton>
        <button
          type="button"
          className="block text-sm font-semibold text-accent"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        >
          {mode === "login" ? "Need an account? Create one" : "Already registered? Sign in"}
        </button>
      </form>
    );
  }

  const groups = [
    { key: "paid", title: "Bought", rows: orders.filter((order) => order.payment_status === "paid") },
    { key: "dispatched", title: "Dispatched", rows: orders.filter((order) => order.status === "dispatched") },
    { key: "delivered", title: "Delivered", rows: orders.filter((order) => order.status === "delivered") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted">{customer.email}</p>
        </div>
        <button type="button" className="text-sm font-semibold text-accent" onClick={() => void logout()}>Sign out</button>
      </div>
      {groups.map((group) => (
        <section key={group.key} className="rounded-md bg-white p-5 shadow-md">
          <h2 className="text-lg font-bold">{group.title}</h2>
          {group.rows.length ? (
            <ul className="mt-4 space-y-4">
              {group.rows.map((order) => (
                <li key={order.id} className="border-t border-line pt-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">Order {order.id}</p>
                    <p className="text-sm">{statusLabel(order.status)} · {formatPrice(order.total)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{order.location}{order.mpesa_receipt ? ` · Receipt ${order.mpesa_receipt}` : ""}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.name}`}>{item.name} × {item.qty}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Nothing in this list yet.</p>
          )}
        </section>
      ))}
      {orders.some((order) => order.payment_status !== "paid") ? (
        <section className="rounded-md bg-white p-5 shadow-md">
          <h2 className="text-lg font-bold">Waiting for payment</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {orders.filter((order) => order.payment_status !== "paid").map((order) => (
              <li key={order.id}>Order {order.id} · {statusLabel(order.payment_status)} · {formatPrice(order.total)}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {!orders.length ? <AccentLink href="/products" className="w-auto px-6">Shop now</AccentLink> : null}
    </div>
  );
}
