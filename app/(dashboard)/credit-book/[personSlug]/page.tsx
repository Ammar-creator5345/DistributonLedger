import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCreditBook } from "@/lib/credit-book-service";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ledger/page-header";
import { StatCard } from "@/components/ledger/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Credit Book",
};

export default async function CreditBookPersonPage({
  params,
}: {
  params: Promise<{ personSlug: string }>;
}) {
  const { personSlug } = await params;
  const slug = decodeURIComponent(personSlug).toLowerCase();

  await connectToDatabase();
  const [settings, people] = await Promise.all([getSettings(), getCreditBook()]);
  const person = people.find((p) => p.name.toLowerCase() === slug);
  if (!person) notFound();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Credit Book — ${person.name}`}
        description="Complete credit history for this person."
      />
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/credit-book">
          <ArrowLeft className="size-4" />
          Back to Credit Book
        </Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total credit given" value={formatMoney(person.totalCredit, settings.currency)} />
        <StatCard label="Total received/paid" value={formatMoney(person.totalReceived, settings.currency)} />
        <StatCard
          label="Remaining balance"
          value={formatMoney(person.balance, settings.currency)}
          valueClassName={person.balance >= 0 ? "text-positive" : "text-negative"}
        />
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-heading text-lg font-semibold">Transaction history</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Salesman</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {person.transactions.map((t, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell className="font-mono font-tabular">
                    {formatMoney(t.amount, settings.currency)}
                  </TableCell>
                  <TableCell>{t.salesman}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Remaining balance</TableCell>
                <TableCell />
                <TableCell className="font-mono font-tabular">
                  {formatMoney(person.balance, settings.currency)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
