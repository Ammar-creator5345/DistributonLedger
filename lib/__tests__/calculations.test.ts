import { describe, expect, it } from "vitest";
import {
  buildCreditBook,
  computeCashCount,
  computeInventoryMovement,
  computeInventoryOpening,
  computeLine,
  dashboardRange,
  inventoryRangeBounds,
  marginPercent,
  round2,
  unsaleableSaleAmount,
  voucherTotals,
  type CreditBookRow,
} from "@/lib/calculations";
import type { SkuLike, VoucherItemInput } from "@/types";

const sku: SkuLike = {
  id: "sku_1",
  name: "Test Cigarette 20s",
  distRate: 100,
  retailRate: 120,
  wholesaleRate: 110,
};

function item(overrides: Partial<VoucherItemInput> = {}): VoucherItemInput {
  return { skuId: sku.id, opening: 0, ret: 0, closing: 0, wholesaleQty: 0, ...overrides };
}

describe("computeLine — sales", () => {
  it("computes a normal sale with no returns and no wholesale", () => {
    const line = computeLine(item({ opening: 100, ret: 0, closing: 80 }), sku);
    expect(line.sale).toBe(20);
    expect(line.retailQty).toBe(20);
    expect(line.wholesaleQty).toBe(0);
  });

  it("computes zero sale when opening equals closing", () => {
    const line = computeLine(item({ opening: 50, ret: 0, closing: 50 }), sku);
    expect(line.sale).toBe(0);
    expect(line.retailQty).toBe(0);
    expect(line.wholesaleQty).toBe(0);
    expect(line.totalAmt).toBe(0);
    expect(line.profit).toBe(0);
  });

  it("subtracts returns from the sale", () => {
    const withReturn = computeLine(item({ opening: 100, ret: 10, closing: 70 }), sku);
    const withoutReturn = computeLine(item({ opening: 100, ret: 0, closing: 80 }), sku);
    expect(withReturn.sale).toBe(20);
    expect(withReturn.sale).toBe(withoutReturn.sale);
  });

  it("derives sale from the closing quantity", () => {
    const line = computeLine(item({ opening: 100, ret: 0, closing: 40 }), sku);
    expect(line.sale).toBe(60);
  });

  it("splits sale into wholesale and retail quantities", () => {
    const line = computeLine(item({ opening: 100, ret: 0, closing: 50, wholesaleQty: 15 }), sku);
    expect(line.sale).toBe(50);
    expect(line.wholesaleQty).toBe(15);
    expect(line.retailQty).toBe(35);
  });

  it("clamps wholesale quantity to the sale when wholesaleQty exceeds it", () => {
    const line = computeLine(item({ opening: 100, ret: 0, closing: 90, wholesaleQty: 50 }), sku);
    expect(line.sale).toBe(10);
    expect(line.wholesaleQty).toBe(10);
    expect(line.retailQty).toBe(0);
  });

  it("clamps retail/wholesale quantities at 0 for a negative sale (data entry error) but keeps the raw sale", () => {
    const line = computeLine(item({ opening: 10, ret: 0, closing: 20, wholesaleQty: 5 }), sku);
    expect(line.sale).toBe(-10);
    expect(line.wholesaleQty).toBe(0);
    expect(line.retailQty).toBe(0);
    expect(line.totalAmt).toBe(0);
  });
});

describe("computeLine — amounts", () => {
  it("computes retail amount as retailQty * retailRate", () => {
    const line = computeLine(item({ opening: 100, closing: 80 }), sku);
    expect(line.retailAmt).toBe(20 * 120);
  });

  it("computes wholesale amount as wholesaleQty * wholesaleRate", () => {
    const line = computeLine(item({ opening: 100, closing: 50, wholesaleQty: 15 }), sku);
    expect(line.wholesaleAmt).toBe(15 * 110);
  });

  it("computes cost as (retailQty + wholesaleQty) * distRate", () => {
    const line = computeLine(item({ opening: 100, closing: 50, wholesaleQty: 15 }), sku);
    expect(line.costAmt).toBe((35 + 15) * 100);
  });

  it("computes profit as retail profit plus wholesale profit, using distRate as cost base", () => {
    const line = computeLine(item({ opening: 100, closing: 50, wholesaleQty: 15 }), sku);
    const retailProfit = (120 - 100) * 35;
    const wholesaleProfit = (110 - 100) * 15;
    expect(line.retailProfit).toBe(retailProfit);
    expect(line.wholesaleProfit).toBe(wholesaleProfit);
    expect(line.profit).toBe(retailProfit + wholesaleProfit);
  });

  it("falls back to zero rates when the SKU is missing", () => {
    const line = computeLine(item({ opening: 100, closing: 80 }), undefined);
    expect(line.totalAmt).toBe(0);
    expect(line.profit).toBe(0);
  });
});

describe("voucherTotals", () => {
  it("sums sale/amount/profit across items and each section independently", () => {
    const lines = [
      computeLine(item({ opening: 100, closing: 80 }), sku),
      computeLine(item({ opening: 50, closing: 30, wholesaleQty: 10 }), sku),
    ];
    const totals = voucherTotals(lines, {
      credits: [{ label: "A", amount: 500 }, { label: "B", amount: 250 }],
      cashReceived: [{ label: "C", amount: 1000 }],
      expenses: [{ label: "Fuel", amount: 200 }],
      other: [{ label: "Misc", amount: 50 }],
    });

    expect(totals.saleQty).toBe(lines[0].sale + lines[1].sale);
    expect(totals.saleAmt).toBe(lines[0].totalAmt + lines[1].totalAmt);
    expect(totals.profit).toBe(lines[0].profit + lines[1].profit);
    expect(totals.credit).toBe(750);
    expect(totals.cash).toBe(1000);
    expect(totals.expense).toBe(200);
    expect(totals.other).toBe(50);
  });

  it("returns zeros for an empty voucher", () => {
    const totals = voucherTotals([], {});
    expect(totals).toEqual({ saleQty: 0, saleAmt: 0, profit: 0, credit: 0, cash: 0, expense: 0, other: 0 });
  });
});

describe("computeCashCount", () => {
  const baseTotals = { saleQty: 0, saleAmt: 10_000, profit: 0, credit: 0, cash: 0, expense: 0, other: 0 };

  it("reports Exact when physical cash matches the required amount", () => {
    const result = computeCashCount({ d5000: 2 }, baseTotals, 0);
    expect(result.physical).toBe(10_000);
    expect(result.required).toBe(10_000);
    expect(result.diff).toBe(0);
    expect(result.status).toBe("Exact");
  });

  it("reports Plus when physical cash exceeds required beyond the tolerance", () => {
    const result = computeCashCount({ d1000: 11 }, baseTotals, 0);
    expect(result.physical).toBe(11_000);
    expect(result.diff).toBeCloseTo(1000, 5);
    expect(result.status).toBe("Plus");
  });

  it("reports Less when physical cash falls short beyond the tolerance", () => {
    const result = computeCashCount({ d1000: 9 }, baseTotals, 0);
    expect(result.physical).toBe(9_000);
    expect(result.status).toBe("Less");
  });

  it("stays Exact within the 0.004 tolerance band", () => {
    const result = computeCashCount({ d1000: 10 }, { ...baseTotals, saleAmt: 10_000.002 }, 0);
    expect(result.status).toBe("Exact");
  });

  it("flips to Less once the shortfall exceeds the tolerance band", () => {
    const result = computeCashCount({ d1000: 10 }, { ...baseTotals, saleAmt: 10_000.01 }, 0);
    expect(result.status).toBe("Less");
  });

  it("subtracts MCB from the amount required", () => {
    const withoutMcb = computeCashCount({ d1000: 10 }, baseTotals, 0);
    const withMcb = computeCashCount({ d1000: 10 }, baseTotals, 1000);
    expect(withoutMcb.required).toBe(10_000);
    expect(withMcb.required).toBe(9_000);
    expect(withMcb.diff).toBe(withoutMcb.diff + 1000);
  });

  it("handles all-zero input as Exact", () => {
    const result = computeCashCount({}, { saleQty: 0, saleAmt: 0, profit: 0, credit: 0, cash: 0, expense: 0, other: 0 }, 0);
    expect(result.physical).toBe(0);
    expect(result.required).toBe(0);
    expect(result.status).toBe("Exact");
  });
});

describe("inventory math", () => {
  it("computes opening stock from base plus net entries minus prior voucher sales", () => {
    expect(computeInventoryOpening(100, 30, 20)).toBe(110);
  });

  it("computes closing stock across a movement window", () => {
    const movement = computeInventoryMovement(100, 50, 30, 5, 10);
    expect(movement.closing).toBe(100 + 50 - 30 - 5 - 10);
  });

  it("accounts for received, damage, unsaleable and sale independently", () => {
    const receivedOnly = computeInventoryMovement(0, 40, 0, 0, 0);
    const damageOnly = computeInventoryMovement(40, 0, 0, 8, 0);
    const unsaleableOnly = computeInventoryMovement(40, 0, 0, 0, 6);
    const saleOnly = computeInventoryMovement(40, 0, 15, 0, 0);
    expect(receivedOnly.closing).toBe(40);
    expect(damageOnly.closing).toBe(32);
    expect(unsaleableOnly.closing).toBe(34);
    expect(saleOnly.closing).toBe(25);
  });
});

describe("marginPercent", () => {
  it("computes profit / revenue * 100", () => {
    expect(marginPercent(250, 1000)).toBe(25);
  });

  it("returns 0 for zero revenue instead of dividing by zero", () => {
    expect(marginPercent(100, 0)).toBe(0);
    expect(Number.isFinite(marginPercent(100, 0))).toBe(true);
  });
});

describe("unsaleableSaleAmount", () => {
  const rates = { retailRate: 120, wholesaleRate: 110, distRate: 100 };

  it("uses the retail rate for retail category", () => {
    expect(unsaleableSaleAmount(5, "retail", rates)).toBe(600);
  });

  it("uses the wholesale rate for wholesale category", () => {
    expect(unsaleableSaleAmount(5, "wholesale", rates)).toBe(550);
  });

  it("uses the distributor rate for distributor category", () => {
    expect(unsaleableSaleAmount(5, "distributor", rates)).toBe(500);
  });
});

describe("buildCreditBook", () => {
  const rows: CreditBookRow[] = [
    { name: "ABC Traders", amount: 5000, kind: "credit", date: "2026-01-05", salesman: "Irfan" },
    { name: "abc traders", amount: 2000, kind: "received", date: "2026-01-10", salesman: "Irfan" },
    { name: "XYZ Store", amount: 1000, kind: "credit", date: "2026-01-03", salesman: "Bilal" },
    { name: " ABC Traders ", amount: 1500, kind: "credit", date: "2026-01-12", salesman: "Bilal" },
    { name: "", amount: 999, kind: "credit", date: "2026-01-01", salesman: "Bilal" },
  ];

  it("merges people case-insensitively regardless of trim/casing", () => {
    const people = buildCreditBook(rows);
    expect(people).toHaveLength(2);
    const abc = people.find((p) => p.name.toLowerCase() === "abc traders");
    expect(abc?.transactions).toHaveLength(3);
  });

  it("keeps the first-seen casing for the display name", () => {
    const people = buildCreditBook(rows);
    const abc = people.find((p) => p.name.toLowerCase() === "abc traders");
    expect(abc?.name).toBe("ABC Traders");
  });

  it("sums credit given and received/paid across multiple vouchers separately", () => {
    const people = buildCreditBook(rows);
    const abc = people.find((p) => p.name.toLowerCase() === "abc traders")!;
    expect(abc.totalCredit).toBe(5000 + 1500);
    expect(abc.totalReceived).toBe(2000);
    expect(abc.balance).toBe(5000 + 1500 - 2000);
  });

  it("ignores blank person names", () => {
    const people = buildCreditBook(rows);
    expect(people.some((p) => p.name.trim() === "")).toBe(false);
  });

  it("sorts people by balance descending", () => {
    const people = buildCreditBook(rows);
    for (let i = 1; i < people.length; i++) {
      expect(people[i - 1].balance).toBeGreaterThanOrEqual(people[i].balance);
    }
  });
});

describe("date range helpers", () => {
  const today = "2026-06-15";

  it("dashboardRange defaults to today..today with no filter", () => {
    expect(dashboardRange({}, today)).toEqual([today, today]);
  });

  it("dashboardRange uses [from, today] when only from is set", () => {
    expect(dashboardRange({ from: "2026-06-01" }, today)).toEqual(["2026-06-01", today]);
  });

  it("dashboardRange uses [epoch, to] when only to is set", () => {
    expect(dashboardRange({ to: "2026-06-10" }, today)).toEqual(["0000-00-00", "2026-06-10"]);
  });

  it("inventoryRangeBounds defaults to the current month, unlike dashboardRange", () => {
    expect(inventoryRangeBounds({}, today)).toEqual(["2026-06-01", "2026-06-30"]);
  });

  it("both use [from, to] when both filters are set", () => {
    const range = { from: "2026-01-01", to: "2026-01-31" };
    expect(dashboardRange(range, today)).toEqual(["2026-01-01", "2026-01-31"]);
    expect(inventoryRangeBounds(range, today)).toEqual(["2026-01-01", "2026-01-31"]);
  });
});

describe("round2", () => {
  it("rounds to two decimal places", () => {
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
    expect(round2(10.004)).toBe(10);
    expect(round2(NaN)).toBe(0);
  });
});
