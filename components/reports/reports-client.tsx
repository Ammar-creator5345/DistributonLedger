"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { SignedAmount } from "@/components/ledger/signed-amount";
import { apiGet } from "@/lib/api-client";
import { DatePicker } from "@/components/ledger/date-picker";
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
import { PageHeader } from "@/components/ledger/page-header";
import { SegmentedToggle } from "@/components/ledger/segmented-toggle";

type ReportTab = "sales" | "revenue" | "profit" | "expenses" | "other" | "cash";
type GroupBy = "sku" | "salesman";
type CashView = "detail" | "summary";

interface QtyRow {
  key: string;
  label: string;
  filerCategory?: string;
  retail: number;
  wholesale: number;
  total: number;
}
interface RevenueRow {
  key: string;
  label: string;
  filerCategory?: string;
  retailAmt: number;
  wholesaleAmt: number;
  total: number;
}
interface ProfitRow {
  key: string;
  label: string;
  filerCategory?: string;
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
interface CashDetailRow {
  date: string;
  salesman: string;
  filer: string;
  totalBeforeMcb: number;
  mcb: number;
  required: number;
  physical: number;
  notes: string;
  status: string;
  diff: number;
}
interface CashSummaryRow {
  salesmanId: string;
  salesman: string;
  filer: string;
  required: number;
  physical: number;
  diff: number;
  count: number;
  mcb: number;
}

const TABS: { value: ReportTab; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "revenue", label: "Revenue" },
  { value: "profit", label: "Profit" },
  { value: "expenses", label: "Expenses" },
  { value: "other", label: "Other" },
  { value: "cash", label: "Cash" },
];

export function ReportsClient({
  salesmen,
  currency,
  initialQtyRows,
}: {
  salesmen: { _id: string; name: string }[];
  currency: string;
  initialQtyRows: QtyRow[];
}) {
  const [tab, setTab] = useState<ReportTab>("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesmanId, setSalesmanId] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("sku");
  const [cashView, setCashView] = useState<CashView>("detail");
  const [loading, setLoading] = useState(false);

  const [qtyRows, setQtyRows] = useState<QtyRow[]>(initialQtyRows);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [profitRows, setProfitRows] = useState<ProfitRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<LabelRow[]>([]);
  const [otherRows, setOtherRows] = useState<LabelRow[]>([]);
  const [cashDetail, setCashDetail] = useState<CashDetailRow[]>([]);
  const [cashSummary, setCashSummary] = useState<CashSummaryRow[]>([]);

  async function load(next: {
    tab: ReportTab;
    from: string;
    to: string;
    salesmanId: string;
    groupBy: GroupBy;
    cashView: CashView;
  }) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: next.tab, groupBy: next.groupBy, cashView: next.cashView });
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.salesmanId) params.set("salesmanId", next.salesmanId);

      if (next.tab === "sales") setQtyRows(await apiGet<QtyRow[]>(`/api/reports?${params}`));
      else if (next.tab === "revenue") setRevenueRows(await apiGet<RevenueRow[]>(`/api/reports?${params}`));
      else if (next.tab === "profit") setProfitRows(await apiGet<ProfitRow[]>(`/api/reports?${params}`));
      else if (next.tab === "expenses") setExpenseRows(await apiGet<LabelRow[]>(`/api/reports?${params}`));
      else if (next.tab === "other") setOtherRows(await apiGet<LabelRow[]>(`/api/reports?${params}`));
      else if (next.tab === "cash") {
        const data = await apiGet<{ view: CashView; rows: CashDetailRow[] | CashSummaryRow[] }>(
          `/api/reports?${params}`
        );
        if (data.view === "summary") setCashSummary(data.rows as CashSummaryRow[]);
        else setCashDetail(data.rows as CashDetailRow[]);
      }
    } catch {
      toast.error("Could not load report.");
    } finally {
      setLoading(false);
    }
  }

  function update(patch: Partial<{ tab: ReportTab; from: string; to: string; salesmanId: string; groupBy: GroupBy; cashView: CashView }>) {
    const next = { tab, from, to, salesmanId, groupBy, cashView, ...patch };
    setTab(next.tab);
    setFrom(next.from);
    setTo(next.to);
    setSalesmanId(next.salesmanId);
    setGroupBy(next.groupBy);
    setCashView(next.cashView);
    load(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Reports" description="Sales, revenue, profit, expenses and cash — computed live from your vouchers." />

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
          <DatePicker value={from} onChange={(v) => update({ from: v })} className="w-full" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
          <DatePicker value={to} onChange={(v) => update({ to: v })} className="w-full" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salesman</label>
          <Select value={salesmanId || "all"} onValueChange={(v) => update({ salesmanId: v === "all" ? "" : v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All salesmen</SelectItem>
              {salesmen.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => update({ tab: v as ReportTab })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {(tab === "sales" || tab === "revenue" || tab === "profit") && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">
              {TABS.find((t) => t.value === tab)?.label} by {groupBy === "sku" ? "SKU" : "salesman"}
            </h2>
            <SegmentedToggle
              value={groupBy}
              onChange={(v) => update({ groupBy: v })}
              options={[
                { value: "sku", label: "By SKU" },
                { value: "salesman", label: "By salesman" },
              ]}
            />
          </div>
        )}

        {tab === "sales" && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "sku" ? "SKU" : "Salesman"}</TableHead>
                  {groupBy === "salesman" && <TableHead>Filer Category</TableHead>}
                  <TableHead>Retail qty</TableHead>
                  <TableHead>Wholesale qty</TableHead>
                  <TableHead>Total qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qtyRows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    {groupBy === "salesman" && <TableCell>{r.filerCategory}</TableCell>}
                    <TableCell className="font-mono font-tabular">{formatNumber(r.retail)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.wholesale)}</TableCell>
                    <TableCell className="font-mono font-tabular font-semibold text-primary">{formatNumber(r.total)}</TableCell>
                  </TableRow>
                ))}
                {!loading && !qtyRows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No data in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "revenue" && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "sku" ? "SKU" : "Salesman"}</TableHead>
                  {groupBy === "salesman" && <TableHead>Filer Category</TableHead>}
                  <TableHead>Retail amount</TableHead>
                  <TableHead>Wholesale amount</TableHead>
                  <TableHead>Total amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueRows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    {groupBy === "salesman" && <TableCell>{r.filerCategory}</TableCell>}
                    <TableCell className="font-mono font-tabular">{formatMoney(r.retailAmt, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(r.wholesaleAmt, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular font-semibold text-primary">{formatMoney(r.total, currency)}</TableCell>
                  </TableRow>
                ))}
                {!loading && !revenueRows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No data in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "profit" && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy === "sku" ? "SKU" : "Salesman"}</TableHead>
                  {groupBy === "salesman" && <TableHead>Filer Category</TableHead>}
                  <TableHead>Qty sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitRows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    {groupBy === "salesman" && <TableCell>{r.filerCategory}</TableCell>}
                    <TableCell className="font-mono font-tabular">{formatNumber(r.qty)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(r.revenue, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(r.cost, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular font-semibold text-primary">{formatMoney(r.profit, currency)}</TableCell>
                    <TableCell className="font-mono font-tabular">{r.margin.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {!loading && !profitRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      No data in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {(tab === "expenses" || tab === "other") && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead>Filer Category</TableHead>
                  <TableHead>{tab === "expenses" ? "Expense" : "Description"}</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tab === "expenses" ? expenseRows : otherRows).map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{r.salesman}</TableCell>
                    <TableCell>{r.filer}</TableCell>
                    <TableCell>{r.label}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(r.amount, currency)}</TableCell>
                  </TableRow>
                ))}
                {!loading && !(tab === "expenses" ? expenseRows : otherRows).length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No data in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "cash" && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">
                Cash — {cashView === "detail" ? "voucher detail" : "by salesman"}
              </h2>
              <SegmentedToggle
                value={cashView}
                onChange={(v) => update({ cashView: v })}
                options={[
                  { value: "detail", label: "Detail" },
                  { value: "summary", label: "By salesman" },
                ]}
              />
            </div>
            {cashView === "detail" ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Salesman</TableHead>
                      <TableHead>Filer Category</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>MCB</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Physical</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plus/Less</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashDetail.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{formatDate(r.date)}</TableCell>
                        <TableCell>{r.salesman}</TableCell>
                        <TableCell>{r.filer}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.totalBeforeMcb, currency)}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.mcb, currency)}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.required, currency)}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.physical, currency)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.notes}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>
                          <SignedAmount value={r.diff} currency={currency} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && !cashDetail.length && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                          No vouchers in this range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesman</TableHead>
                      <TableHead>Filer Category</TableHead>
                      <TableHead>Vouchers</TableHead>
                      <TableHead>MCB total</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Physical</TableHead>
                      <TableHead>Plus/Less</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashSummary.map((r) => (
                      <TableRow key={r.salesmanId}>
                        <TableCell className="font-medium">{r.salesman}</TableCell>
                        <TableCell>{r.filer}</TableCell>
                        <TableCell className="font-mono font-tabular">{r.count}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.mcb, currency)}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.required, currency)}</TableCell>
                        <TableCell className="font-mono font-tabular">{formatMoney(r.physical, currency)}</TableCell>
                        <TableCell>
                          <SignedAmount value={r.diff} currency={currency} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && !cashSummary.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                          No vouchers in this range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
