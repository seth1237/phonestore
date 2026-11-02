import Link from "next/link";

const classes =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent bg-accent px-4 py-4 text-center text-[1rem] font-bold text-white shadow-md transition-all duration-300 hover:bg-secondary hover:text-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function AccentButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${classes} w-full ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AccentLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${classes} ${className}`}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${classes} ${className}`}>
      {children}
    </Link>
  );
}
