import { Voucher } from "@/models/Voucher";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { computeCashCount, computeLine, marginPercent, voucherTotals } from "@/lib/calculations";
import { notesSummary } from "@/lib/voucher-notes";
import type { SkuLike } from "@/types";

export type GroupBy = "sku" | "salesman";

interface VoucherLean {
  _id: unknown;
  date: string;
  salesmanId: unknown;
  items: { skuId: unknown; opening?: number; ret?: number; closing?: number; wholesaleQty?: number }[];
  credits?: { label?: string; amount?: number }[];
  cashReceived?: { label?: string; amount?: number }[];
  expenses?: { label?: string; amount?: number }[];
  other?: { label?: string; amount?: number }[];
  cashCount?: Record<string, number>;
  mcb?: number;
}

async function loadContext(from?: string, to?: string, salesmanId?: string) {
  const query: Record<string, unknown> = {};
  if (from || to) {
    query.date = {};
    if (from) (query.date as Record<string, unknown>).$gte = from;
    if (to) (query.date as Record<string, unknown>).$lte = to;
  }
  if (salesmanId) query.salesmanId = salesmanId;

  const [vouchers, salesmen, skus] = await Promise.all([
    Voucher.find(query).lean() as unknown as Promise<VoucherLean[]>,
    Salesman.find().lean(),
    Sku.find().lean(),
  ]);

  const salesmanMap = new Map(salesmen.map((s) => [String(s._id), { name: s.name, filerCategory: s.filerCategory || "—" }]));
  const skuMap = new Map<string, SkuLike>(
    skus.map((s) => [
      String(s._id),
      { id: String(s._id), name: s.name, distRate: s.distRate, retailRate: s.retailRate, wholesaleRate: s.wholesaleRate, category: s.category as SkuLike["category"] },
    ])
  );

  return { vouchers, salesmanMap, skuMap };
}

function labelFor(groupBy: GroupBy, key: string, skuMap: Map<string, SkuLike>, salesmanMap: Map<string, { name: string; filerCategory: string }>) {
  if (groupBy === "sku") return skuMap.get(key)?.name ?? "Unknown SKU";
  return salesmanMap.get(key)?.name ?? "—";
}

export async function getQtyReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined, groupBy: GroupBy) {
  const { vouchers, salesmanMap, skuMap } = await loadContext(from, to, salesmanId);
  const map = new Map<string, { retail: number; wholesale: number; total: number }>();

  for (const v of vouchers) {
    for (const it of v.items) {
      const line = computeLine(it as never, skuMap.get(String(it.skuId)));
      const key = groupBy === "sku" ? String(it.skuId) : String(v.salesmanId);
      if (!key) continue;
      const acc = map.get(key) ?? { retail: 0, wholesale: 0, total: 0 };
      acc.retail += line.retailQty;
      acc.wholesale += line.wholesaleQty;
      acc.total += line.sale;
      map.set(key, acc);
    }
  }

  const rows = Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: labelFor(groupBy, key, skuMap, salesmanMap),
      filerCategory: groupBy === "salesman" ? salesmanMap.get(key)?.filerCategory : undefined,
      ...v,
    }))
    .sort((a, b) => b.total - a.total);

  return rows;
}

export async function getRevenueReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined, groupBy: GroupBy) {
  const { vouchers, salesmanMap, skuMap } = await loadContext(from, to, salesmanId);
  const map = new Map<string, { retailAmt: number; wholesaleAmt: number; total: number }>();

  for (const v of vouchers) {
    for (const it of v.items) {
      const line = computeLine(it as never, skuMap.get(String(it.skuId)));
      const key = groupBy === "sku" ? String(it.skuId) : String(v.salesmanId);
      if (!key) continue;
      const acc = map.get(key) ?? { retailAmt: 0, wholesaleAmt: 0, total: 0 };
      acc.retailAmt += line.retailAmt;
      acc.wholesaleAmt += line.wholesaleAmt;
      acc.total += line.totalAmt;
      map.set(key, acc);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: labelFor(groupBy, key, skuMap, salesmanMap),
      filerCategory: groupBy === "salesman" ? salesmanMap.get(key)?.filerCategory : undefined,
      ...v,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getProfitReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined, groupBy: GroupBy) {
  const { vouchers, salesmanMap, skuMap } = await loadContext(from, to, salesmanId);
  const map = new Map<string, { qty: number; revenue: number; cost: number; profit: number }>();

  for (const v of vouchers) {
    for (const it of v.items) {
      const line = computeLine(it as never, skuMap.get(String(it.skuId)));
      const key = groupBy === "sku" ? String(it.skuId) : String(v.salesmanId);
      if (!key) continue;
      const acc = map.get(key) ?? { qty: 0, revenue: 0, cost: 0, profit: 0 };
      acc.qty += line.sale;
      acc.revenue += line.totalAmt;
      acc.cost += line.costAmt;
      acc.profit += line.profit;
      map.set(key, acc);
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: labelFor(groupBy, key, skuMap, salesmanMap),
      filerCategory: groupBy === "salesman" ? salesmanMap.get(key)?.filerCategory : undefined,
      ...v,
      margin: marginPercent(v.profit, v.revenue),
    }))
    .sort((a, b) => b.profit - a.profit);
}

export async function getExpensesReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined) {
  const { vouchers, salesmanMap } = await loadContext(from, to, salesmanId);
  const rows: { date: string; salesman: string; filer: string; label: string; amount: number }[] = [];
  for (const v of vouchers) {
    for (const ex of v.expenses ?? []) {
      if (!ex.label && !ex.amount) continue;
      const info = salesmanMap.get(String(v.salesmanId));
      rows.push({ date: v.date, salesman: info?.name ?? "—", filer: info?.filerCategory ?? "—", label: ex.label || "(unnamed)", amount: Number(ex.amount) || 0 });
    }
  }
  rows.sort((a, b) => (b.date < a.date ? -1 : 1));
  return rows;
}

export async function getOtherReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined) {
  const { vouchers, salesmanMap } = await loadContext(from, to, salesmanId);
  const rows: { date: string; salesman: string; filer: string; label: string; amount: number }[] = [];
  for (const v of vouchers) {
    for (const ex of v.other ?? []) {
      if (!ex.label && !ex.amount) continue;
      const info = salesmanMap.get(String(v.salesmanId));
      rows.push({ date: v.date, salesman: info?.name ?? "—", filer: info?.filerCategory ?? "—", label: ex.label || "(unnamed)", amount: Number(ex.amount) || 0 });
    }
  }
  rows.sort((a, b) => (b.date < a.date ? -1 : 1));
  return rows;
}

export async function getCashReport(from: string | undefined, to: string | undefined, salesmanId: string | undefined, view: "detail" | "summary") {
  const { vouchers, salesmanMap, skuMap } = await loadContext(from, to, salesmanId);

  if (view === "summary") {
    const map = new Map<string, { required: number; physical: number; diff: number; count: number; mcb: number }>();
    for (const v of vouchers) {
      const lines = v.items.map((it) => computeLine(it as never, skuMap.get(String(it.skuId))));
      const totals = voucherTotals(lines, v as never);
      const cc = computeCashCount((v.cashCount ?? {}) as never, totals, v.mcb ?? 0);
      const key = String(v.salesmanId);
      const acc = map.get(key) ?? { required: 0, physical: 0, diff: 0, count: 0, mcb: 0 };
      acc.required += cc.required;
      acc.physical += cc.physical;
      acc.diff += cc.diff;
      acc.mcb += cc.mcb;
      acc.count++;
      map.set(key, acc);
    }
    return {
      view: "summary" as const,
      rows: Array.from(map.entries())
        .map(([key, v]) => ({ salesmanId: key, salesman: salesmanMap.get(key)?.name ?? "—", filer: salesmanMap.get(key)?.filerCategory ?? "—", ...v }))
        .sort((a, b) => b.diff - a.diff),
    };
  }

  const sorted = [...vouchers].sort((a, b) => (b.date < a.date ? -1 : 1));
  const rows = sorted.map((v) => {
    const lines = v.items.map((it) => computeLine(it as never, skuMap.get(String(it.skuId))));
    const totals = voucherTotals(lines, v as never);
    const cc = computeCashCount((v.cashCount ?? {}) as never, totals, v.mcb ?? 0);
    const info = salesmanMap.get(String(v.salesmanId));
    return {
      date: v.date,
      salesman: info?.name ?? "—",
      filer: info?.filerCategory ?? "—",
      totalBeforeMcb: cc.totalBeforeMcb,
      mcb: cc.mcb,
      required: cc.required,
      physical: cc.physical,
      notes: notesSummary(v.cashCount),
      status: cc.status,
      diff: cc.diff,
    };
  });
  return { view: "detail" as const, rows };
}
