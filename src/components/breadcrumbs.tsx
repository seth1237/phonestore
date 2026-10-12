import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-row items-center space-x-2 text-[0.875rem]">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center space-x-2">
            {index > 0 ? <span className="text-muted">/</span> : null}
            {item.href && !last ? (
              <Link href={item.href} className="text-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-black" : "text-muted"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
