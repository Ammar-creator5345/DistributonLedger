"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { computeCashCount, computeLine, voucherTotals } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import { buildVoucherPrintHtml, openPrintWindow } from "@/lib/print-voucher";
import { apiDelete, apiGet } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ledger/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Printer, Trash2 } from "lucide-react";
import AddIcon from "@mui/icons-material/Add";
import type { SkuLike } from "@/types";

interface VoucherRow {
  _id: string;
  date: string;
  salesmanId: string;
  items: { skuId: string; opening: number; ret: number; closing: number; wholesaleQty: number }[];
  credits: { label: string; amount: number }[];
  cashReceived: { label: string; amount: number }[];
  expenses: { label: string; amount: number }[];
  other: { label: string; amount: number }[];
  cashCount: Record<string, number>;
  mcb: number;
}

export function VouchersTable({
  initialVouchers,
  salesmen,
  skus,
  currency,
  businessName,
}: {
  initialVouchers: VoucherRow[];
  salesmen: { _id: string; name: string }[];
  skus: (SkuLike & { _id: string })[];
  currency: string;
  businessName: string;
}) {
  const router = useRouter();
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesmanId, setSalesmanId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const skuMap = new Map(skus.map((s) => [s._id, s]));
  const salesmanMap = new Map(salesmen.map((s) => [s._id, s.name]));

  async function refetch(next: { from: string; to: string; salesmanId: string }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.salesmanId) params.set("salesmanId", next.salesmanId);
      const data = await apiGet<VoucherRow[]>(`/api/vouchers?${params.toString()}`);
      setVouchers(data);
    } catch {
      toast.error("Could not load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  function updateFrom(value: string) {
    setFrom(value);
    refetch({ from: value, to, salesmanId });
  }
  function updateTo(value: string) {
    setTo(value);
    refetch({ from, to: value, salesmanId });
  }
  function updateSalesman(value: string) {
    setSalesmanId(value);
    refetch({ from, to, salesmanId: value });
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/vouchers/${id}`);
      setVouchers((prev) => prev.filter((v) => v._id !== id));
      toast.success("Voucher deleted.");
    } catch {
      toast.error("Could not delete voucher.");
    }
  }

  function handlePrint(v: VoucherRow) {
    const lines = v.items.map((it) => computeLine(it, skuMap.get(it.skuId)));
    const totals = voucherTotals(lines, v);
    const cashCount = computeCashCount(v.cashCount, totals, v.mcb);
    const skuLines = lines
      .map((line, idx) => {
        const sku = skuMap.get(v.items[idx].skuId);
        return line.sale ? { name: sku?.name ?? "Unknown SKU", qty: line.sale, amount: line.totalAmt } : null;
      })
      .filter((l): l is { name: string; qty: number; amount: number } => l !== null);
    const html = buildVoucherPrintHtml({
      businessName,
      currency,
      salesmanName: salesmanMap.get(v.salesmanId) ?? "—",
      date: v.date,
      skuLines,
      totals,
      cashCount,
    });
    if (!openPrintWindow(html)) toast.error("Please allow pop-ups to print.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
          <DatePicker value={from} onChange={updateFrom} className="w-[160px]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
          <DatePicker value={to} onChange={updateTo} className="w-[160px]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salesman</label>
          <Select value={salesmanId || "all"} onValueChange={(v) => updateSalesman(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
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
        <div className="ml-auto">
          <Button asChild>
            <Link href="/vouchers/new">
              <AddIcon fontSize="small" /> New voucher
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Salesman</TableHead>
              <TableHead>Sale qty</TableHead>
              <TableHead>Sale amount</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((v) => {
              const lines = v.items.map((it) => computeLine(it, skuMap.get(it.skuId)));
              const totals = voucherTotals(lines, v);
              return (
                <TableRow key={v._id}>
                  <TableCell>{formatDate(v.date)}</TableCell>
                  <TableCell>{salesmanMap.get(v.salesmanId) ?? "—"}</TableCell>
                  <TableCell className="font-mono font-tabular">{totals.saleQty}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.saleAmt, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.credit, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.cash, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.expense, currency)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => router.push(`/vouchers/${v._id}`)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Print" onClick={() => handlePrint(v)}>
                        <Printer className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteId(v._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && !vouchers.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                  No vouchers yet. Create your first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete this voucher?"
        description="This cannot be undone."
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
        }}
      />
    </div>
  );
}
