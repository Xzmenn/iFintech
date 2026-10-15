import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function Money({
  amount,
  currency = "IDR",
  colored = false,
  className,
}: {
  amount: number | string | { toNumber: () => number };
  currency?: string;
  colored?: boolean;
  className?: string;
}) {
  const value = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return (
    <span
      className={cn(
        colored && value > 0 && "text-emerald-600",
        colored && value < 0 && "text-rose-600",
        className,
      )}
    >
      {formatCurrency(value, currency)}
    </span>
  );
}
