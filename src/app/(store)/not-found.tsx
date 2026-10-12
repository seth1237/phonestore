import { AccentLink } from "@/components/accent-button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-md text-[1rem] leading-7 text-[#374151]">
        That link does not match a product, category, or page in the shop.
      </p>
      <div className="w-full max-w-xs">
        <AccentLink href="/">Back to the shop</AccentLink>
      </div>
    </div>
  );
}
