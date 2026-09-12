import { DENOMINATIONS } from "@/types";

/** "5000×2, 1000×3" summary of denomination counts, matching the source app's notesSummary(). */
export function notesSummary(cashCount: Record<string, number> | undefined): string {
  const cc = cashCount ?? {};
  const parts = DENOMINATIONS.filter((d) => (Number(cc[`d${d}`]) || 0) > 0).map(
    (d) => `${d}×${cc[`d${d}`]}`
  );
  return parts.length ? parts.join(", ") : "—";
}
