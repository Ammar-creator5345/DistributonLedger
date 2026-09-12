import { cn } from "@/lib/utils";
import { formatMoney, formatSigned } from "@/lib/format";

/** Consistent positive/negative treatment everywhere — spec section 47 (amt-pos / amt-neg). */
export function SignedAmount({
  value,
  currency,
  className,
}: {
  value: number;
  currency: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono font-tabular font-semibold",
        value >= 0 ? "text-positive" : "text-negative",
        className
      )}
    >
      {formatSigned(value, currency)}
    </span>
  );
}

export function MoneyText({
  value,
  currency,
  className,
  tone,
}: {
  value: number;
  currency: string;
  className?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : undefined;
  return (
    <span className={cn("font-mono font-tabular", toneClass, className)}>
      {formatMoney(value, currency)}
    </span>
  );
}
