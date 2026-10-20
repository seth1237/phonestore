import type { Metadata } from "next";
import Link from "next/link";
import { getSite } from "@/lib/api";
import { formatHours, mapsDirectionsUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "About Us",
    description: `Learn about ${site.name}, find our shop, and view contact details and opening hours.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const site = await getSite();

  return (
    <main className="space-y-6 px-4 py-8">
      <section className="rounded-md bg-white px-5 py-8 shadow-md sm:px-8">
        <h1 className="text-2xl font-bold sm:text-3xl">About Us</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink">
          {site.name} offers phones, laptops and accessories. Visit our shop or contact us to ask about products and availability.
        </p>
      </section>

      <section className="grid gap-6 rounded-md bg-white px-5 py-8 shadow-md sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        <div>
          <h2 className="text-lg font-semibold">Visit us</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{site.address}</p>
          <a
            href={mapsDirectionsUrl(site.coordinates.lat, site.coordinates.lng)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded text-sm font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Get directions
          </a>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-2 flex flex-col items-start gap-2 text-sm">
            {site.phones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone}`}
                className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {phone}
              </a>
            ))}
            {site.email ? (
              <a
                href={`mailto:${site.email}`}
                className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {site.email}
              </a>
            ) : null}
            <Link
              href="/contact"
              className="rounded font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Contact us
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Opening hours</h2>
          <dl className="mt-2 space-y-2 text-sm">
            {site.hours.map((slot) => (
              <div key={slot.day} className="flex justify-between gap-4">
                <dt className="text-muted">{slot.day}</dt>
                <dd className="font-medium text-ink">{formatHours(slot.open, slot.close)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
