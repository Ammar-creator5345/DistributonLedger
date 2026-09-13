"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { formatDate, formatMoney } from "@/lib/format";
import { apiGet } from "@/lib/api-client";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ledger/page-header";

interface OtherRow {
  date: string;
  salesman: string;
  label: string;
  amount: number;
}

export function OthersClient({
  salesmen,
  currency,
  initialRows,
}: {
  salesmen: { _id: string; name: string }[];
  currency: string;
  initialRows: OtherRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesmanId, setSalesmanId] = useState("");

  async function refetch(next: { from: string; to: string; salesmanId: string }) {
    try {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.salesmanId) params.set("salesmanId", next.salesmanId);
      const data = await apiGet<OtherRow[]>(`/api/others?${params.toString()}`);
      setRows(data);
    } catch {
      toast.error("Could not load Others.");
    }
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Others"
        description='All "Other" transactions entered on vouchers, shown here separately for a clear, dedicated view.'
      />

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
          <DatePicker
            value={from}
            onChange={(v) => {
              setFrom(v);
              refetch({ from: v, to, salesmanId });
            }}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
          <DatePicker
            value={to}
            onChange={(v) => {
              setTo(v);
              refetch({ from, to: v, salesmanId });
            }}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Salesman</label>
          <Select
            value={salesmanId || "all"}
            onValueChange={(v) => {
              const next = v === "all" ? "" : v;
              setSalesmanId(next);
              refetch({ from, to, salesmanId: next });
            }}
          >
            <SelectTrigger className="w-full">
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
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-heading text-lg font-semibold">Others log</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Salesman</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{r.salesman}</TableCell>
                  <TableCell>{r.label}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(r.amount, currency)}</TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No Other entries recorded in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(total, currency)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
