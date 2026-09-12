import { round2 } from "@/lib/calculations";

export function formatNumber(n: number): string {
  const value = round2(n);
  const options: Intl.NumberFormatOptions =
    value % 1 === 0
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return value.toLocaleString("en-PK", options);
}

export function formatMoney(n: number, currency: string): string {
  return `${currency} ${formatNumber(n)}`;
}

export function formatSigned(n: number, currency: string): string {
  return `${n >= 0 ? "+ " : "- "}${formatMoney(Math.abs(n), currency)}`;
}

/** Renders a "YYYY-MM-DD" ledger date string as "DD Mon YYYY", matching the source app. */
export function formatDate(d: string | undefined | null): string {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
