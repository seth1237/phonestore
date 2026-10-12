import { CheckoutForm } from "@/components/checkout-form";
import { getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const site = await getSite();
  return <CheckoutForm site={site} />;
}
