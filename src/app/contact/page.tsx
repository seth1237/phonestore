import { ContactBoard } from "@/components/contact-board";
import { getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const site = await getSite();
  return <ContactBoard site={site} />;
}
