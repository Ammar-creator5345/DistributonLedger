"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
import { unsaleableSaleSchema, type UnsaleableSaleInput } from "@/schemas/unsaleable";
import { unsaleableSaleAmount } from "@/lib/calculations";
import { formatDate, formatMoney, formatNumber, todayStr } from "@/lib/format";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PageHeader } from "@/components/ledger/page-header";
import { DatePicker } from "@/components/ledger/date-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import type { SkuLike } from "@/types";

interface SaleRow {
  _id: string;
  date: string;
  skuId: string;
  category: "retail" | "wholesale" | "distributor";
  qty: number;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function UnsaleableClient({
  skus,
  currency,
  initialSales,
}: {
  skus: (SkuLike & { _id: string })[];
  currency: string;
  initialSales: SaleRow[];
}) {
  const [sales, setSales] = useState(initialSales);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const skuMap = new Map(skus.map((s) => [s._id, s]));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnsaleableSaleInput>({
    resolver: zodResolver(unsaleableSaleSchema),
    defaultValues: { date: todayStr(), skuId: skus[0]?._id ?? "", category: "retail", qty: 0 },
  });

  async function refetch(next: { from: string; to: string }) {
    try {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      const data = await apiGet<SaleRow[]>(`/api/unsaleable?${params.toString()}`);
      setSales(data);
    } catch {
      toast.error("Could not load unsaleable stock sales.");
    }
  }

  async function onSubmit(values: UnsaleableSaleInput) {
    try {
      await apiPost("/api/unsaleable", values);
      toast.success("Unsaleable stock sale added.");
      reset({ date: values.date, skuId: values.skuId, category: values.category, qty: 0 });
      refetch({ from, to });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/unsaleable/${id}`);
      setSales((prev) => prev.filter((s) => s._id !== id));
      toast.success("Removed.");
    } catch {
      toast.error("Could not remove.");
    }
  }

  const total = sales.reduce((s, sale) => {
    const sku = skuMap.get(sale.skuId);
    return s + (sku ? unsaleableSaleAmount(sale.qty, sale.category, sku) : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Unsaleable Stock Sale"
        description="Kept separately identifiable from normal voucher sales, but included in overall sale totals."
      />

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-1 font-heading text-lg font-semibold">Record an Unsaleable Stock Sale</h2>
        <p className="mb-6 text-xs text-muted-foreground">
          This is a separate sale category for stock that would normally be written off as
          unsaleable, but is being sold anyway.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field data-invalid={!!errors.date}>
                <FieldLabel htmlFor="unsDate">Date</FieldLabel>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker id="unsDate" value={field.value} onChange={field.onChange} clearable={false} />
                  )}
                />
                <FieldError errors={[errors.date]} />
              </Field>
              <Field data-invalid={!!errors.skuId}>
                <FieldLabel htmlFor="unsSku">SKU</FieldLabel>
                <Controller
                  control={control}
                  name="skuId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="unsSku">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {skus.map((s) => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.skuId]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="unsCategory">Sale category</FieldLabel>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="unsCategory">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.qty}>
                <FieldLabel htmlFor="unsQty">Quantity sold</FieldLabel>
                <Input id="unsQty" type="number" step="0.01" {...register("qty", { valueAsNumber: true })} />
                <FieldError errors={[errors.qty]} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                Add unsaleable stock sale
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
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
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
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
        <h2 className="mb-3 font-heading text-lg font-semibold">Unsaleable Stock Sale log</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => {
                const sku = skuMap.get(s.skuId);
                const amount = sku ? unsaleableSaleAmount(s.qty, s.category, sku) : 0;
                return (
                  <TableRow key={s._id}>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell className="font-medium">{sku?.name ?? "Unknown SKU"}</TableCell>
                    <TableCell>{capitalize(s.category)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(s.qty)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatMoney(amount, currency)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteId(s._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!sales.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No unsaleable stock sales recorded in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {sales.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="font-mono font-tabular">{formatMoney(total, currency)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Remove this unsaleable stock sale?"
        description="This cannot be undone."
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
        }}
      />
    </div>
  );
}
