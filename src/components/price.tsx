import { formatPrice, isInStock } from "@/lib/format";

export function Price({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  if (!isInStock(amount)) {
    return <span className={`text-[0.875rem] font-semibold text-[#445D6A] ${className}`}>Out of stock</span>;
  }
  return <span className={className}>{formatPrice(amount)}</span>;
}
