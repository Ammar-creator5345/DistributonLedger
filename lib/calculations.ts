/**
 * Pure, deterministic business calculations ported from the source ledger
 * application. Nothing here touches the database or the clock (except where
 * "today" is passed in explicitly) so every function is directly
 * unit-testable and safe to run on the server as the single source of truth
 * for financial and inventory math (spec sections 15-22).
 */
import {
  DENOMINATIONS,
  type AmountRow,
  type CashCountResult,
  type CashStatus,
  type InventoryMovement,
  type LineCalculation,
  type SkuLike,
  type UnsaleableCategory,
  type VoucherItemInput,
  type VoucherTotals,
} from "@/types";

type SkuRates = Pick<SkuLike, "retailRate" | "wholesaleRate" | "distRate">;

export function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Sale amount always comes from the Price List (retail/wholesale rate), never
 * from the voucher. Distributor Rate is only the cost base used for profit,
 * not a separate sale category — see spec section 16.
 */
export function computeLine(item: VoucherItemInput, sku: SkuRates | undefined): LineCalculation {
  const opening = Number(item.opening) || 0;
  const ret = Number(item.ret) || 0;
  const closing = Number(item.closing) || 0;
  const sale = opening - ret - closing;

  const wholesaleQty = Math.min(Number(item.wholesaleQty) || 0, Math.max(sale, 0));
  const retailQty = Math.max(sale - wholesaleQty, 0);

  const retailRate = sku?.retailRate ?? 0;
  const wholesaleRate = sku?.wholesaleRate ?? 0;
  const distRate = sku?.distRate ?? 0;

  const retailAmt = retailQty * retailRate;
  const wholesaleAmt = wholesaleQty * wholesaleRate;
  const retailProfit = (retailRate - distRate) * retailQty;
  const wholesaleProfit = (wholesaleRate - distRate) * wholesaleQty;
  const costAmt = (retailQty + wholesaleQty) * distRate;
  const totalAmt = retailAmt + wholesaleAmt;
  const profit = retailProfit + wholesaleProfit;

  return {
    opening,
    ret,
    closing,
    sale,
    wholesaleQty,
    retailQty,
    retailAmt,
    wholesaleAmt,
    retailProfit,
    wholesaleProfit,
    costAmt,
    totalAmt,
    profit,
  };
}

function sumAmountRows(rows: AmountRow[] | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

export function voucherTotals(
  lines: LineCalculation[],
  sections: {
    credits?: AmountRow[];
    cashReceived?: AmountRow[];
    expenses?: AmountRow[];
    other?: AmountRow[];
  }
): VoucherTotals {
  let saleQty = 0;
  let saleAmt = 0;
  let profit = 0;
  for (const line of lines) {
    saleQty += line.sale;
    saleAmt += line.totalAmt;
    profit += line.profit;
  }

  return {
    saleQty,
    saleAmt,
    profit,
    credit: sumAmountRows(sections.credits),
    cash: sumAmountRows(sections.cashReceived),
    expense: sumAmountRows(sections.expenses),
    other: sumAmountRows(sections.other),
  };
}

/** Cash reconciliation. The 0.004 tolerance and rounding-half-cent thresholds are pinned to the source app — do not alter (spec section 18). */
export function computeCashCount(
  cashCount: Partial<Record<`d${(typeof DENOMINATIONS)[number]}`, number>>,
  totals: VoucherTotals,
  mcbInput: number
): CashCountResult {
  let physical = 0;
  const breakdown = DENOMINATIONS.map((den) => {
    const qty = Number(cashCount[`d${den}`]) || 0;
    const amt = den * qty;
    physical += amt;
    return { den, qty, amt };
  });

  const mcb = Number(mcbInput) || 0;
  const totalBeforeMcb = totals.saleAmt - totals.credit + totals.cash - totals.expense + totals.other;
  const required = totalBeforeMcb - mcb;
  const diff = physical - required;

  let status: CashStatus = "Exact";
  if (diff > 0.004) status = "Plus";
  else if (diff < -0.004) status = "Less";

  return { breakdown, physical, totalBeforeMcb, mcb, required, diff, status };
}

export function unsaleableSaleAmount(
  qty: number,
  category: UnsaleableCategory,
  sku: SkuRates
): number {
  const rate =
    category === "wholesale"
      ? sku.wholesaleRate
      : category === "distributor"
        ? sku.distRate
        : sku.retailRate;
  return (Number(qty) || 0) * rate;
}

/** opening = openingBase + Σ(received - damage - unsaleableQty, entries before date) - Σ(voucher sale qty, vouchers before date) */
export function computeInventoryOpening(
  openingBase: number,
  entriesNet: number,
  voucherSalesBefore: number
): number {
  return (Number(openingBase) || 0) + entriesNet - voucherSalesBefore;
}

export function computeInventoryMovement(
  opening: number,
  received: number,
  sale: number,
  damage: number,
  unsaleable: number
): InventoryMovement {
  const closing = opening + received - sale - damage - unsaleable;
  return { opening, received, sale, damage, unsaleable, closing };
}

export function marginPercent(profit: number, revenue: number): number {
  return revenue ? (profit / revenue) * 100 : 0;
}

/* ---------------- credit book ---------------- */

export interface CreditBookRow {
  name: string;
  amount: number;
  kind: "credit" | "received";
  date: string;
  salesman: string;
}

export interface CreditBookTransaction {
  date: string;
  type: "Credit given" | "Received/Paid";
  amount: number;
  salesman: string;
}

export interface CreditBookPerson {
  name: string;
  totalCredit: number;
  totalReceived: number;
  balance: number;
  transactions: CreditBookTransaction[];
}

/** Groups credit/cashReceived rows by case-insensitive trimmed person name (spec section 22). */
export function buildCreditBook(rows: CreditBookRow[]): CreditBookPerson[] {
  const persons = new Map<string, CreditBookPerson>();

  for (const row of rows) {
    const name = (row.name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();

    let person = persons.get(key);
    if (!person) {
      person = { name, totalCredit: 0, totalReceived: 0, balance: 0, transactions: [] };
      persons.set(key, person);
    }

    const amount = Number(row.amount) || 0;
    if (row.kind === "credit") {
      person.totalCredit += amount;
      person.transactions.push({ date: row.date, type: "Credit given", amount, salesman: row.salesman });
    } else {
      person.totalReceived += amount;
      person.transactions.push({ date: row.date, type: "Received/Paid", amount, salesman: row.salesman });
    }
  }

  const people = Array.from(persons.values());
  for (const person of people) {
    person.balance = person.totalCredit - person.totalReceived;
    person.transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  people.sort((a, b) => b.balance - a.balance);
  return people;
}

/* ---------------- date ranges ---------------- */

function monthEnd(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, "0")}`;
}

/** Dashboard default range is today..today when no filter is set — matches the source app exactly. */
export function dashboardRange(
  filter: { from?: string; to?: string },
  today: string
): [string, string] {
  if (filter.from && filter.to) return [filter.from, filter.to];
  if (filter.from) return [filter.from, today];
  if (filter.to) return ["0000-00-00", filter.to];
  return [today, today];
}

/** Inventory default range is the current month — matches the source app exactly (differs from dashboardRange). */
export function inventoryRangeBounds(
  filter: { from?: string; to?: string },
  today: string
): [string, string] {
  if (filter.from && filter.to) return [filter.from, filter.to];
  if (filter.from) return [filter.from, today];
  if (filter.to) return ["0000-00-00", filter.to];
  const month = today.slice(0, 7);
  return [`${month}-01`, monthEnd(month)];
}
