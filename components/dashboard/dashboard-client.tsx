"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "@/lib/toast";
import { apiGet } from "@/lib/api-client";
import { computeLine, unsaleableSaleAmount } from "@/lib/calculations";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ledger/page-header";
import { StatCard } from "@/components/ledger/stat-card";
import { DatePicker } from "@/components/ledger/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardTab = "overview" | "top" | "avg";

interface RevenueRow {
  key: string;
  label: string;
  retailAmt: number;
  wholesaleAmt: number;
  total: number;
}
interface ProfitRow {
  key: string;
  label: string;
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}
interface LabelRow {
  date: string;
  salesman: string;
  filer: string;
  label: string;
  amount: number;
}
interface CreditPerson {
  name: string;
  totalCredit: number;
  totalReceived: number;
  balance: number;
}
interface UnsaleableRow {
  _id: string;
  date: string;
  skuId: string;
  category: "retail" | "wholesale" | "distributor";
  qty: number;
}
interface VoucherRow {
  _id: string;
  date: string;
  salesmanId: string;
  items: { skuId: string; opening: number; ret: number; closing: number; wholesaleQty: number }[];
  credits: { label: string; amount: number }[];
  cashReceived: { label: string; amount: number }[];
  expenses: { label: string; amount: number }[];
  other: { label: string; amount: number }[];
}
interface SkuRow {
  _id: string;
  name: string;
  category: "" | "FMC" | "NC";
  distRate: number;
  retailRate: number;
  wholesaleRate: number;
}
interface SalesmanRow {
  _id: string;
  name: string;
}

interface DashboardData {
  from: string;
  to: string;
  revenueBySku: RevenueRow[];
  revenueBySalesman: RevenueRow[];
  profitBySku: ProfitRow[];
  expenseRows: LabelRow[];
  creditPeople: CreditPerson[];
  unsaleableSales: UnsaleableRow[];
  vouchers: VoucherRow[];
}

export function DashboardClient({
  currency,
  salesmen,
  skus,
  initial,
}: {
  currency: string;
  salesmen: SalesmanRow[];
  skus: SkuRow[];
  initial: DashboardData;
}) {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [salesmanId, setSalesmanId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData>(initial);

  const skuMap = useMemo(() => new Map(skus.map((s) => [s._id, s])), [skus]);

  async function load(next: { from: string; to: string; salesmanId: string; skuId: string }) {
    setLoading(true);
    try {
      const reportParams = new URLSearchParams();
      if (next.from) reportParams.set("from", next.from);
      if (next.to) reportParams.set("to", next.to);
      if (next.salesmanId) reportParams.set("salesmanId", next.salesmanId);
      const rangeParams = new URLSearchParams();
      if (next.from) rangeParams.set("from", next.from);
      if (next.to) rangeParams.set("to", next.to);

      const [revenueBySku, revenueBySalesman, profitBySku, expenseRows, creditPeople, unsaleableSales, vouchers] =
        await Promise.all([
          apiGet<RevenueRow[]>(`/api/reports?tab=revenue&groupBy=sku&${reportParams}`),
          apiGet<RevenueRow[]>(`/api/reports?tab=revenue&groupBy=salesman&${reportParams}`),
          apiGet<ProfitRow[]>(`/api/reports?tab=profit&groupBy=sku&${reportParams}`),
          apiGet<LabelRow[]>(`/api/reports?tab=expenses&${reportParams}`),
          apiGet<CreditPerson[]>(`/api/credit-book?${rangeParams}`),
          apiGet<UnsaleableRow[]>(`/api/unsaleable?${rangeParams}`),
          apiGet<VoucherRow[]>(`/api/vouchers?${reportParams}`),
        ]);
      setData({ from: next.from, to: next.to, revenueBySku, revenueBySalesman, profitBySku, expenseRows, creditPeople, unsaleableSales, vouchers });
    } catch {
      toast.error("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  function update(patch: Partial<{ from: string; to: string; salesmanId: string; skuId: string }>) {
    const next = { from, to, salesmanId, skuId, ...patch };
    setFrom(next.from);
    setTo(next.to);
    setSalesmanId(next.salesmanId);
    setSkuId(next.skuId);
    load(next);
  }

  const unsaleableInRange = skuId ? data.unsaleableSales.filter((s) => s.skuId === skuId) : data.unsaleableSales;
  const unsaleableAmt = unsaleableInRange.reduce((sum, s) => {
    const sku = skuMap.get(s.skuId);
    return sum + (sku ? unsaleableSaleAmount(s.qty, s.category, sku) : 0);
  }, 0);

  const saleAmt =
    (skuId
      ? (data.revenueBySku.find((r) => r.key === skuId)?.total ?? 0)
      : data.revenueBySku.reduce((s, r) => s + r.total, 0)) + unsaleableAmt;
  const profit = skuId
    ? (data.profitBySku.find((r) => r.key === skuId)?.profit ?? 0)
    : data.profitBySku.reduce((s, r) => s + r.profit, 0);
  // Credit given / cash received / expenses have no SKU association, so — matching the source
  // app's dashboard — they're excluded (not just re-scoped) whenever a SKU filter is active.
  const expense = skuId ? 0 : data.expenseRows.reduce((s, r) => s + r.amount, 0);
  const creditGiven = skuId ? 0 : data.creditPeople.reduce((s, p) => s + p.totalCredit, 0);
  const cashReceived = skuId ? 0 : data.creditPeople.reduce((s, p) => s + p.totalReceived, 0);
  const topSalesman = !salesmanId && data.revenueBySalesman.length ? data.revenueBySalesman[0] : null;

  const voucherCount = data.vouchers.length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" description="Overview of your sales, inventory and cash position." />

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From Date</label>
          <DatePicker value={from} onChange={(v) => update({ from: v })} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To Date</label>
          <DatePicker value={to} onChange={(v) => update({ to: v })} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salesman</label>
          <Select value={salesmanId || "all"} onValueChange={(v) => update({ salesmanId: v === "all" ? "" : v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {salesmen.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">SKU</label>
          <Select value={skuId || "all"} onValueChange={(v) => update({ skuId: v === "all" ? "" : v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {skus.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DashboardTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top">Top performance</TabsTrigger>
          <TabsTrigger value="avg">AVG</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "overview" && (
        <OverviewTab
          currency={currency}
          from={data.from}
          to={data.to}
          voucherCount={voucherCount}
          saleAmt={saleAmt}
          unsaleableAmt={unsaleableAmt}
          profit={profit}
          expense={expense}
          creditGiven={creditGiven}
          cashReceived={cashReceived}
          topSalesman={topSalesman}
          showTopSalesman={!salesmanId}
          revenueBySku={data.revenueBySku}
          skuMap={skuMap}
          vouchers={data.vouchers}
          salesmen={salesmen}
          loading={loading}
        />
      )}
      {tab === "top" && <TopPerformanceTab revenueBySku={data.revenueBySku} skuMap={skuMap} loading={loading} />}
      {tab === "avg" && (
        <AvgTab vouchers={data.vouchers} skuMap={skuMap} currency={currency} skuIdFilter={skuId} loading={loading} />
      )}
    </div>
  );
}

function OverviewTab({
  currency,
  from,
  to,
  voucherCount,
  saleAmt,
  unsaleableAmt,
  profit,
  expense,
  creditGiven,
  cashReceived,
  topSalesman,
  showTopSalesman,
  revenueBySku,
  skuMap,
  vouchers,
  salesmen,
  loading,
}: {
  currency: string;
  from: string;
  to: string;
  voucherCount: number;
  saleAmt: number;
  unsaleableAmt: number;
  profit: number;
  expense: number;
  creditGiven: number;
  cashReceived: number;
  topSalesman: RevenueRow | null;
  showTopSalesman: boolean;
  revenueBySku: RevenueRow[];
  skuMap: Map<string, SkuRow>;
  vouchers: VoucherRow[];
  salesmen: SalesmanRow[];
  loading: boolean;
}) {
  const salesmanNameById = useMemo(() => new Map(salesmen.map((s) => [s._id, s.name])), [salesmen]);
  const topSkus = revenueBySku.slice(0, 8);
  const fmcTotal = revenueBySku.reduce((s, r) => (skuMap.get(r.key)?.category === "FMC" ? s + r.total : s), 0);
  const ncTotal = revenueBySku.reduce((s, r) => (skuMap.get(r.key)?.category === "NC" ? s + r.total : s), 0);
  const hasPieData = fmcTotal > 0 || ncTotal > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <StatCard
          label="Sale amount"
          value={formatMoney(saleAmt, currency)}
          sub={
            <>
              {voucherCount} voucher(s), {formatDate(from)}
              {from !== to ? ` – ${formatDate(to)}` : ""}
              {unsaleableAmt ? ` (incl. ${formatMoney(unsaleableAmt, currency)} Unsaleable)` : ""}
            </>
          }
          className="flex flex-col justify-center sm:w-2/5"
          valueClassName="text-2xl"
        />
        <div className="grid grid-cols-2 gap-3 sm:w-3/5">
          <StatCard label="Profit" value={formatMoney(profit, currency)} />
          <StatCard label="Expenses" value={formatMoney(expense, currency)} />
          <StatCard label="Credit given" value={formatMoney(creditGiven, currency)} />
          <StatCard label="Cash received" value={formatMoney(cashReceived, currency)} />
        </div>
      </div>
      {showTopSalesman && (
        <StatCard
          label="Top salesman"
          value={topSalesman?.label ?? "—"}
          valueClassName="font-heading text-base"
          sub={topSalesman ? formatMoney(topSalesman.total, currency) : undefined}
          className="w-full"
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/vouchers/new">
            <AddIcon fontSize="small" /> New voucher
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/reports">View reports</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Manage price list</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold">Top SKUs by revenue</h2>
          {topSkus.length ? (
            <BarChart
              height={260}
              dataset={topSkus.map((r) => ({ label: r.label, total: r.total }))}
              xAxis={[{ scaleType: "band", dataKey: "label", tickLabelStyle: { fontSize: 10 } }]}
              series={[{ dataKey: "total", label: `Revenue (${currency})`, color: "var(--chart-1)" }]}
              margin={{ left: 60 }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales in this range.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold">FMC vs NC revenue split</h2>
          {hasPieData ? (
            <PieChart
              height={260}
              series={[
                {
                  data: [
                    { id: "fmc", value: fmcTotal, label: "FMC", color: "var(--chart-1)" },
                    { id: "nc", value: ncTotal, label: "NC", color: "var(--chart-2)" },
                  ],
                  innerRadius: 50,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No categorized sales in this range.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-heading text-lg font-semibold">Vouchers in range</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Salesman</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.slice(0, 8).map((v) => {
                const credit = v.credits.reduce((s, r) => s + (r.amount || 0), 0);
                const cash = v.cashReceived.reduce((s, r) => s + (r.amount || 0), 0);
                const exp = v.expenses.reduce((s, r) => s + (r.amount || 0), 0);
                return (
                  <TableRow key={v._id}>
                    <TableCell>{formatDate(v.date)}</TableCell>
                    <TableCell>{salesmanNameById.get(v.salesmanId) ?? "—"}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(credit, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(cash, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(exp, currency)}</TableCell>
                  </TableRow>
                );
              })}
              {!loading && !vouchers.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No vouchers in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function TopPerformanceTab({
  revenueBySku,
  skuMap,
  loading,
}: {
  revenueBySku: RevenueRow[];
  skuMap: Map<string, SkuRow>;
  loading: boolean;
}) {
  const fmcRows = revenueBySku.filter((r) => skuMap.get(r.key)?.category === "FMC").slice(0, 5);
  const ncRows = revenueBySku.filter((r) => skuMap.get(r.key)?.category === "NC").slice(0, 5);
  const uncategorizedCount = revenueBySku.filter((r) => !skuMap.get(r.key)?.category).length;

  function renderRows(rows: RevenueRow[], label: string) {
    if (!loading && !rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No {label} sales in this range.</p>;
    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.key}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium">{r.label}</TableCell>
                <TableCell className="font-mono font-tabular font-semibold text-primary">{formatNumber(r.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-heading text-lg font-semibold">Top FMC SKUs</h2>
        {renderRows(fmcRows, "FMC")}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-heading text-lg font-semibold">Top NC SKUs</h2>
        {renderRows(ncRows, "NC")}
      </div>
      {uncategorizedCount > 0 && (
        <div className="rounded-lg border border-secondary bg-secondary/50 p-4 text-sm text-secondary-foreground">
          {uncategorizedCount} SKU(s) with sales in this range have no FMC/NC category set yet, so they&apos;re
          excluded above. Set categories in Admin → Price list.
        </div>
      )}
    </div>
  );
}

function AvgTab({
  vouchers,
  skuMap,
  currency,
  skuIdFilter,
  loading,
}: {
  vouchers: VoucherRow[];
  skuMap: Map<string, SkuRow>;
  currency: string;
  skuIdFilter: string;
  loading: boolean;
}) {
  const rows = useMemo(() => {
    const acc = new Map<string, { qty: number; amt: number; days: Set<string> }>();
    for (const v of vouchers) {
      for (const item of v.items) {
        if (skuIdFilter && item.skuId !== skuIdFilter) continue;
        const sku = skuMap.get(item.skuId);
        const line = computeLine(item, sku);
        if (line.sale === 0 && line.totalAmt === 0) continue;
        const entry = acc.get(item.skuId) ?? { qty: 0, amt: 0, days: new Set<string>() };
        entry.qty += line.sale;
        entry.amt += line.totalAmt;
        entry.days.add(v.date);
        acc.set(item.skuId, entry);
      }
    }
    return Array.from(acc.entries())
      .map(([skuId, v]) => {
        const dayCount = v.days.size || 1;
        return {
          skuId,
          name: skuMap.get(skuId)?.name ?? "Unknown SKU",
          avgQty: v.qty / dayCount,
          avgAmt: v.amt / dayCount,
          dayCount: v.days.size,
        };
      })
      .sort((a, b) => b.avgAmt - a.avgAmt);
  }, [vouchers, skuMap, skuIdFilter]);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 font-heading text-lg font-semibold">Average sale per SKU</h2>
      {!loading && !rows.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No sales in this range.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Avg qty/day</TableHead>
                <TableHead>Avg amount/day</TableHead>
                <TableHead>Days with sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.skuId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(r.avgQty)}</TableCell>
                  <TableCell className="font-mono font-tabular font-semibold text-primary">
                    {formatMoney(r.avgAmt, currency)}
                  </TableCell>
                  <TableCell>{r.dayCount} day(s)</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
