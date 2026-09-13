"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { formatMoney } from "@/lib/format";
import { apiGet } from "@/lib/api-client";
import { DatePicker } from "@/components/ledger/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ledger/page-header";

interface Person {
  name: string;
  totalCredit: number;
  totalReceived: number;
  balance: number;
}

export function CreditBookClient({
  currency,
  initialPeople,
}: {
  currency: string;
  initialPeople: Person[];
}) {
  const [people, setPeople] = useState(initialPeople);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function refetch(next: { from: string; to: string }) {
    try {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      const data = await apiGet<Person[]>(`/api/credit-book?${params.toString()}`);
      setPeople(data);
    } catch {
      toast.error("Could not load credit book.");
    }
  }

  const totals = people.reduce(
    (s, p) => ({
      credit: s.credit + p.totalCredit,
      received: s.received + p.totalReceived,
      balance: s.balance + p.balance,
    }),
    { credit: 0, received: 0, balance: 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Credit Book"
        description="Person-wise credit given, receiving/payment, and remaining balance. Salesman Cash and MCB are never included here."
      />

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From Date</label>
          <DatePicker
            value={from}
            onChange={(v) => {
              setFrom(v);
              refetch({ from: v, to });
            }}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To Date</label>
          <DatePicker
            value={to}
            onChange={(v) => {
              setTo(v);
              refetch({ from, to: v });
            }}
            className="w-full"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-heading text-lg font-semibold">All persons</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Total credit given</TableHead>
                <TableHead>Total received/paid</TableHead>
                <TableHead>Remaining balance</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((p) => (
                <TableRow key={p.name.toLowerCase()}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(p.totalCredit, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(p.totalReceived, currency)}</TableCell>
                  <TableCell
                    className={`font-mono font-tabular font-semibold ${p.balance >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {formatMoney(p.balance, currency)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/credit-book/${encodeURIComponent(p.name.toLowerCase())}`}>
                        View history
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!people.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No credit or receiving transactions in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {people.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.credit, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.received, currency)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(totals.balance, currency)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
