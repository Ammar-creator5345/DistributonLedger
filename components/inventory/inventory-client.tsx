"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/lib/toast";
import { formatDate, formatNumber } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api-client";
import { inventoryEntrySchema, type InventoryEntryInput } from "@/schemas/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface MovementRow {
  skuId: string;
  name: string;
  opening: number;
  received: number;
  sale: number;
  damage: number;
  unsaleable: number;
  closing: number;
}

interface LogEntry {
  _id: string;
  date: string;
  skuId: string;
  relatedSalesmanId?: string;
  received: number;
  unsaleableQty: number;
  unsaleableReason?: string;
  reference?: string;
}

type ViewName = "movement" | "entry" | "receiving" | "unsaleable";

/** Compact "DD/MM/YYYY" rendering of a "YYYY-MM-DD" ledger date, used only for the Stock
 * movement range heading — every other date display keeps the shared `formatDate` format. */
function formatDateSlash(d: string | undefined | null): string {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${dt.getFullYear()}`;
}

export function InventoryClient({
  skus,
  salesmen,
  initialMovement,
}: {
  skus: { _id: string; name: string }[];
  salesmen: { _id: string; name: string }[];
  initialMovement: { from: string; to: string; rows: MovementRow[] };
}) {
  const [view, setView] = useState<ViewName>("movement");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [skuId, setSkuId] = useState("");
  const [movement, setMovement] = useState(initialMovement);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const skuMap = new Map(skus.map((s) => [s._id, s.name]));
  const salesmanMap = new Map(salesmen.map((s) => [s._id, s.name]));

  async function loadMovement(next: { from: string; to: string; skuId: string }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.skuId) params.set("skuId", next.skuId);
      const data = await apiGet<{ from: string; to: string; rows: MovementRow[] }>(
        `/api/inventory?${params.toString()}`
      );
      setMovement(data);
    } catch {
      toast.error("Could not load inventory movement.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLog(kind: "receiving" | "unsaleable", next: { from: string; to: string; skuId: string }) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (next.from) params.set("from", next.from);
      if (next.to) params.set("to", next.to);
      if (next.skuId) params.set("skuId", next.skuId);
      const data = await apiGet<LogEntry[]>(`/api/inventory/entries?${params.toString()}`);
      setLogs(data);
    } catch {
      toast.error("Could not load log.");
    } finally {
      setLoading(false);
    }
  }

  function handleViewChange(next: ViewName) {
    setView(next);
    if (next === "movement") loadMovement({ from, to, skuId });
    if (next === "receiving") loadLog("receiving", { from, to, skuId });
    if (next === "unsaleable") loadLog("unsaleable", { from, to, skuId });
  }

  function handleFilterChange(patch: Partial<{ from: string; to: string; skuId: string }>) {
    const next = { from, to, skuId, ...patch };
    setFrom(next.from);
    setTo(next.to);
    setSkuId(next.skuId);
    if (view === "movement") loadMovement(next);
    if (view === "receiving") loadLog("receiving", next);
    if (view === "unsaleable") loadLog("unsaleable", next);
  }

  const totals = movement.rows.reduce(
    (s, r) => ({
      opening: s.opening + r.opening,
      received: s.received + r.received,
      sale: s.sale + r.sale,
      damage: s.damage + r.damage,
      unsaleable: s.unsaleable + r.unsaleable,
      closing: s.closing + r.closing,
    }),
    { opening: 0, received: 0, sale: 0, damage: 0, unsaleable: 0, closing: 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Inventory"
        description="Overall warehouse stock — opening, received, sale, damage, unsaleable and closing."
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
          <DatePicker value={from} onChange={(v) => handleFilterChange({ from: v })} className="w-[160px]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
          <DatePicker value={to} onChange={(v) => handleFilterChange({ to: v })} className="w-[160px]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">SKU</label>
          <Select value={skuId || "all"} onValueChange={(v) => handleFilterChange({ skuId: v === "all" ? "" : v })}>
            <SelectTrigger className="w-[220px]">
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

      <Tabs value={view} onValueChange={(v) => handleViewChange(v as ViewName)}>
        <TabsList>
          <TabsTrigger value="movement">Movement</TabsTrigger>
          <TabsTrigger value="entry">Add entry</TabsTrigger>
          <TabsTrigger value="receiving">Receiving log</TabsTrigger>
          <TabsTrigger value="unsaleable">Unsaleable log</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "movement" && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Stock movement — {formatDateSlash(movement.from)}
            {movement.from !== movement.to ? `-${formatDateSlash(movement.to)}` : ""}
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Damage</TableHead>
                  <TableHead>Unsaleable</TableHead>
                  <TableHead>Closing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movement.rows.map((r) => (
                  <TableRow key={r.skuId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.opening)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.received)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.sale)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.damage)}</TableCell>
                    <TableCell className="font-mono font-tabular">{formatNumber(r.unsaleable)}</TableCell>
                    <TableCell className="font-mono font-tabular font-semibold text-primary">
                      {formatNumber(r.closing)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.opening)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.received)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.sale)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.damage)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.unsaleable)}</TableCell>
                  <TableCell className="font-mono font-tabular">{formatNumber(totals.closing)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

      {view === "entry" && <EntryForm skus={skus} salesmen={salesmen} />}

      {(view === "receiving" || view === "unsaleable") && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            {view === "receiving" ? "Warehouse receiving log" : "Unsaleable stock log"}
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>SKU</TableHead>
                  {view === "receiving" ? (
                    <TableHead>Qty received</TableHead>
                  ) : (
                    <>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </>
                  )}
                  <TableHead>Related salesman</TableHead>
                  {view === "receiving" && <TableHead>Reference</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell>{formatDate(e.date)}</TableCell>
                    <TableCell>{skuMap.get(e.skuId) ?? "Unknown SKU"}</TableCell>
                    {view === "receiving" ? (
                      <TableCell className="font-mono font-tabular">{formatNumber(e.received)}</TableCell>
                    ) : (
                      <>
                        <TableCell className="font-mono font-tabular">{formatNumber(e.unsaleableQty)}</TableCell>
                        <TableCell>{e.unsaleableReason || "—"}</TableCell>
                      </>
                    )}
                    <TableCell>{e.relatedSalesmanId ? salesmanMap.get(e.relatedSalesmanId) : "—"}</TableCell>
                    {view === "receiving" && <TableCell>{e.reference || "—"}</TableCell>}
                  </TableRow>
                ))}
                {!loading && !logs.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No records in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryForm({
  skus,
  salesmen,
}: {
  skus: { _id: string; name: string }[];
  salesmen: { _id: string; name: string }[];
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryEntryInput>({
    resolver: zodResolver(inventoryEntrySchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      skuId: skus[0]?._id ?? "",
      relatedSalesmanId: undefined,
      received: 0,
      damage: 0,
      unsaleableQty: 0,
      unsaleableReason: "",
      reference: "",
    },
  });

  async function onSubmit(values: InventoryEntryInput) {
    try {
      await apiPost("/api/inventory/entries", values);
      toast.success("Inventory entry saved.");
      reset({ ...values, received: 0, damage: 0, unsaleableQty: 0, unsaleableReason: "", reference: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save entry.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-1 font-heading text-lg font-semibold">
        Record received / damage / unsaleable stock
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Saving this updates that date + SKU&apos;s entry. Opening and closing stock are calculated
        automatically from history.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="invDate">Date</FieldLabel>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker id="invDate" value={field.value} onChange={field.onChange} clearable={false} />
                )}
              />
              <FieldError errors={[errors.date]} />
            </Field>
            <Field data-invalid={!!errors.skuId}>
              <FieldLabel htmlFor="invSku">SKU</FieldLabel>
              <Controller
                control={control}
                name="skuId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="invSku" className="w-full">
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
              <FieldLabel htmlFor="invSalesman">Related salesman (optional)</FieldLabel>
              <Controller
                control={control}
                name="relatedSalesmanId"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger id="invSalesman" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {salesmen.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!errors.received}>
              <FieldLabel htmlFor="invReceived">Received qty</FieldLabel>
              <Input id="invReceived" type="number" step="0.01" {...register("received", { valueAsNumber: true })} />
              <FieldError errors={[errors.received]} />
            </Field>
            <Field data-invalid={!!errors.damage}>
              <FieldLabel htmlFor="invDamage">Damage qty</FieldLabel>
              <Input id="invDamage" type="number" step="0.01" {...register("damage", { valueAsNumber: true })} />
              <FieldError errors={[errors.damage]} />
            </Field>
            <Field data-invalid={!!errors.unsaleableQty}>
              <FieldLabel htmlFor="invUnsaleable">Unsaleable qty</FieldLabel>
              <Input
                id="invUnsaleable"
                type="number"
                step="0.01"
                {...register("unsaleableQty", { valueAsNumber: true })}
              />
              <FieldError errors={[errors.unsaleableQty]} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="invReason">Unsaleable reason</FieldLabel>
              <Input id="invReason" placeholder="e.g. expired, damaged in transit" {...register("unsaleableReason")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invReference">Reference / voucher #</FieldLabel>
              <Input id="invReference" placeholder="Optional" {...register("reference")} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Save entry
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
