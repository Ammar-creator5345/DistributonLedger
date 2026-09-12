import { formatMoney, formatNumber } from "@/lib/format";
import type { VoucherTotals } from "@/types";

export function VoucherTotalsBar({
  totals,
  currency,
}: {
  totals: VoucherTotals;
  currency: string;
}) {
  const items: [string, string][] = [
    ["Total sale qty", formatNumber(totals.saleQty)],
    ["Total sale amount", formatMoney(totals.saleAmt, currency)],
    ["Credit given", formatMoney(totals.credit, currency)],
    ["Cash received", formatMoney(totals.cash, currency)],
    ["Expenses", formatMoney(totals.expense, currency)],
    ["Other", formatMoney(totals.other, currency)],
  ];

  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <strong className="font-mono font-tabular text-base text-primary">{value}</strong>
        </div>
      ))}
    </div>
  );
}
