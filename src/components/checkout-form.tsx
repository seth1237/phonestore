"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccentButton, AccentLink } from "@/components/accent-button";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import { CUSTOMER_EVENT, customerToken } from "@/lib/customer-session";
import type { Site } from "@/lib/types";
import { apiFetch } from "@/lib/client-api";

type Customer = { name: string; email: string; phone: string };

type PaymentState = {
  orderId: number;
  checkoutRequestId: string;
  message: string;
  paymentStatus: string;
  receipt: string;
  total: number;
};

export function CheckoutForm({ site }: { site: Site }) {
  const { detailed, total, clear, count } = useCart();
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const token = customerToken();
      if (!token) {
        if (!ignore) {
          setCustomer(null);
          setAccountReady(true);
        }
        return;
      }
      const response = await apiFetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        if (!ignore) {
          setCustomer(null);
          setAccountReady(true);
        }
        return;
      }
      const data = (await response.json()) as { customer: Customer };
      if (!ignore) {
        setCustomer(data.customer);
        setAccountReady(true);
      }
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(CUSTOMER_EVENT, onChange);
    return () => {
      ignore = true;
      window.removeEventListener(CUSTOMER_EVENT, onChange);
    };
  }, []);

  useEffect(() => {
    if (!payment || payment.paymentStatus === "paid" || payment.paymentStatus === "failed") return undefined;
    const timer = window.setInterval(async () => {
      const response = await apiFetch(`/api/payments/${encodeURIComponent(payment.checkoutRequestId)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { paymentStatus?: string; receipt?: string; message?: string; status?: string };
      setPayment((current) => current && ({
        ...current,
        paymentStatus: data.paymentStatus || current.paymentStatus,
        receipt: data.receipt || current.receipt,
        message: data.message || current.message,
      }));
      if (data.paymentStatus === "paid" || data.paymentStatus === "failed") {
        window.clearInterval(timer);
        if (data.paymentStatus === "paid") clear();
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [payment, clear]);

  if (payment?.paymentStatus === "paid") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start space-y-6 px-4 py-16">
        <h1 className="text-2xl font-bold">Payment received</h1>
        <p className="text-[1rem] leading-7">
          {site.name} has the order. M-Pesa receipt {payment.receipt || "is being confirmed"}. Track dispatch and delivery from your account.
        </p>
        <p className="text-sm font-semibold">{formatPrice(payment.total)}</p>
        <AccentLink href="/account" className="w-auto px-6">View your orders</AccentLink>
      </div>
    );
  }

  if (payment) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start space-y-6 px-4 py-16">
        <h1 className="text-2xl font-bold">{payment.paymentStatus === "failed" ? "Payment not completed" : "Check your phone"}</h1>
        <p className="text-[1rem] leading-7">
          {payment.paymentStatus === "failed"
            ? payment.message || "The M-Pesa prompt was cancelled. You can try again from the cart."
            : "Enter your M-Pesa PIN on the prompt. This page updates when Safaricom confirms the payment."}
        </p>
        <AccentLink href="/cart" className="w-auto px-6">Back to cart</AccentLink>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-8 lg:flex-row">
      <form
        className="w-full space-y-4 rounded-md bg-white px-4 py-8 shadow-md lg:w-[60%]"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!detailed.length || waiting) return;
          if (customer && !editing && !confirmed) {
            setError("Confirm that these details are right before paying.");
            return;
          }
          setError("");
          setWaiting(true);
          const form = new FormData(event.currentTarget);
          const headers = new Headers({ "Content-Type": "application/json" });
          const token = customerToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
          const response = await apiFetch("/api/orders", {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: form.get("name"),
              phone: form.get("phone"),
              email: form.get("email"),
              location: form.get("location"),
              notes: form.get("notes"),
              mpesaPhone: form.get("mpesaPhone"),
              items: detailed.map(({ product, variant, qty }) => ({
                productId: product.id,
                variantId: variant?.id,
                qty,
              })),
            }),
          });
          setWaiting(false);
          const data = (await response.json().catch(() => null)) as {
            error?: string;
            id?: number;
            total?: number;
            payment?: { checkoutRequestId?: string; message?: string };
          } | null;
          if (!response.ok || !data?.payment?.checkoutRequestId || !data.id) {
            setError(data?.error || "The M-Pesa prompt could not be sent. Try again.");
            return;
          }
          setPayment({
            orderId: data.id,
            checkoutRequestId: data.payment.checkoutRequestId,
            message: data.payment.message || "",
            paymentStatus: "pending",
            receipt: "",
            total: Number(data.total) || total,
          });
        }}
      >
        <h1 className="text-2xl font-bold">Pay with M-Pesa</h1>
        {!accountReady ? <p className="text-sm text-muted">Loading your details…</p> : null}
        {accountReady && customer && !editing ? (
          <div className="space-y-2 rounded-md border border-line bg-page px-4 py-4 text-sm">
            <p className="font-semibold">Confirm these details</p>
            <p>{customer.name}</p>
            <p>{customer.email}</p>
            <p>{customer.phone || "No phone saved"}</p>
            <p className="text-muted">The M-Pesa prompt goes to this phone.</p>
            <button type="button" className="font-semibold text-accent" onClick={() => { setEditing(true); setConfirmed(false); }}>
              These details are not right
            </button>
            <label className="flex items-center gap-2 pt-2 font-semibold">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              These details are right
            </label>
            <input type="hidden" name="name" value={customer.name} />
            <input type="hidden" name="email" value={customer.email} />
            <input type="hidden" name="phone" value={customer.phone} />
            <input type="hidden" name="mpesaPhone" value={customer.phone} />
          </div>
        ) : accountReady ? (
          <>
            {!customer ? <p className="text-sm leading-6 text-muted">Sign in so this order is saved to your account. <Link href="/account" className="font-semibold text-accent">Account</Link></p> : null}
            <label className="block text-sm font-semibold" htmlFor="checkout-name">Full name</label>
            <input id="checkout-name" name="name" required defaultValue={customer?.name || ""} className="w-full rounded-md border border-line px-3 py-3 text-sm" />
            <label className="block text-sm font-semibold" htmlFor="checkout-phone">Phone</label>
            <input id="checkout-phone" name="phone" required type="tel" defaultValue={customer?.phone || ""} className="w-full rounded-md border border-line px-3 py-3 text-sm" />
            <label className="block text-sm font-semibold" htmlFor="checkout-mpesa">M-Pesa number</label>
            <input id="checkout-mpesa" name="mpesaPhone" required type="tel" placeholder="07XX XXX XXX" defaultValue={customer?.phone || ""} className="w-full rounded-md border border-line px-3 py-3 text-sm" />
            <label className="block text-sm font-semibold" htmlFor="checkout-email">Email</label>
            <input id="checkout-email" name="email" required type="email" defaultValue={customer?.email || ""} className="w-full rounded-md border border-line px-3 py-3 text-sm" />
          </>
        ) : null}
        <label className="block text-sm font-semibold" htmlFor="checkout-location">Delivery location</label>
        <input id="checkout-location" name="location" required className="w-full rounded-md border border-line px-3 py-3 text-sm" />
        <label className="block text-sm font-semibold" htmlFor="checkout-notes">Delivery notes</label>
        <textarea id="checkout-notes" name="notes" className="min-h-28 w-full rounded-md border border-line px-3 py-3 text-sm" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <AccentButton type="submit" disabled={!detailed.length || waiting || !accountReady || (Boolean(customer) && !editing && !confirmed)}>
          {waiting ? "Sending prompt…" : `Pay ${formatPrice(total)}`}
        </AccentButton>
        {!detailed.length ? <p className="text-sm text-muted">Add items to your cart before paying.</p> : null}
      </form>
      <aside className="h-fit w-full rounded-md bg-white px-4 py-8 shadow-md lg:w-[40%]">
        <h2 className="text-2xl font-bold">Summary</h2>
        <ul className="mt-6 space-y-3">
          {detailed.map(({ lineId, product, qty, price, label }) => (
            <li key={lineId} className="flex justify-between text-sm">
              <span>{product.name}{label ? ` (${label})` : ""} × {qty}</span>
              <span className="font-semibold">{formatPrice(price * qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-between border-t border-line pt-4 text-sm font-semibold">
          <span>{count} items</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>
    </div>
  );
}
