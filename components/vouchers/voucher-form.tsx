"use client";

import { useRef, useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { voucherSchema, type VoucherInput } from "@/schemas/voucher";
import { computeLine, voucherTotals, computeCashCount } from "@/lib/calculations";
import { apiGet, apiPost, apiPatch } from "@/lib/api-client";
import { buildVoucherPrintHtml, openPrintWindow } from "@/lib/print-voucher";
import { DENOMINATIONS, type SkuLike } from "@/types";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ledger/page-header";
import { DatePicker } from "@/components/ledger/date-picker";
import { VoucherItemRow } from "@/components/vouchers/voucher-item-row";
import { DynamicRowsSection } from "@/components/vouchers/dynamic-rows-section";
import { CashCountPanel } from "@/components/vouchers/cash-count-panel";
import { VoucherTotalsBar } from "@/components/vouchers/voucher-totals-bar";
import { AddSkuDialog } from "@/components/vouchers/add-sku-dialog";

const SECTION_CONFIG = {
  credits: { title: "Credit given", placeholder: "Person / shop name" },
  cashReceived: { title: "Cash received", placeholder: "Person / source" },
  expenses: { title: "Expenses", placeholder: "Expense name" },
  other: { title: "Other", placeholder: "Description" },
} as const;

type SectionName = keyof typeof SECTION_CONFIG;

export function VoucherForm({
  mode,
  voucherId,
  initialValues,
  skus: initialSkus,
  salesmen,
  currency,
  businessName,
}: {
  mode: "new" | "edit";
  voucherId?: string;
  initialValues: VoucherInput;
  skus: (SkuLike & { _id: string })[];
  salesmen: { _id: string; name: string }[];
  currency: string;
  businessName: string;
}) {
  const router = useRouter();
  const [skus, setSkus] = useState(initialSkus);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedListRef = useRef<SectionName | null>(null);

  const { register, control, handleSubmit, setValue, getValues } = useForm<VoucherInput>({
    resolver: zodResolver(voucherSchema),
    defaultValues: initialValues,
  });

  const itemsArray = useFieldArray({ control, name: "items" });
  const creditsArray = useFieldArray({ control, name: "credits" });
  const cashReceivedArray = useFieldArray({ control, name: "cashReceived" });
  const expensesArray = useFieldArray({ control, name: "expenses" });
  const otherArray = useFieldArray({ control, name: "other" });

  const sections: Record<SectionName, { fields: { id: string }[]; append: (v: { label: string; amount: number }) => void }> = {
    credits: creditsArray,
    cashReceived: cashReceivedArray,
    expenses: expensesArray,
    other: otherArray,
  };

  const values = useWatch({ control });
  const skuMap = new Map(skus.map((s) => [s._id, s]));

  const lines = (itemsArray.fields ?? []).map((f, idx) => {
    const item = values.items?.[idx] ?? f;
    return computeLine(
      {
        skuId: f.skuId,
        opening: Number(item.opening) || 0,
        ret: Number(item.ret) || 0,
        closing: Number(item.closing) || 0,
        wholesaleQty: Number(item.wholesaleQty) || 0,
      },
      skuMap.get(f.skuId)
    );
  });
  const totals = voucherTotals(lines, {
    credits: values.credits as { label: string; amount: number }[] | undefined,
    cashReceived: values.cashReceived as { label: string; amount: number }[] | undefined,
    expenses: values.expenses as { label: string; amount: number }[] | undefined,
    other: values.other as { label: string; amount: number }[] | undefined,
  });
  const cashCount = computeCashCount(
    (values.cashCount ?? {}) as Record<string, number>,
    totals,
    Number(values.mcb) || 0
  );

  async function refreshAutofill(nextSalesmanId: string, nextDate: string) {
    if (mode !== "new" || !nextSalesmanId || !nextDate) return;
    try {
      const opening = await apiGet<Record<string, number>>(
        `/api/vouchers/autofill?salesmanId=${nextSalesmanId}&date=${nextDate}`
      );
      itemsArray.fields.forEach((f, idx) => {
        if (opening[f.skuId] !== undefined) {
          setValue(`items.${idx}.opening`, opening[f.skuId]);
        }
      });
    } catch {
      // Autofill is a convenience only — saving still works without it.
    }
  }

  async function onSubmit(data: VoucherInput) {
    setSubmitting(true);
    try {
      if (mode === "new") {
        await apiPost("/api/vouchers", data);
        toast.success("Voucher saved.");
      } else {
        await apiPatch(`/api/vouchers/${voucherId}`, data);
        toast.success("Voucher updated.");
      }
      router.push("/vouchers");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save voucher.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    const skuLines = lines
      .map((line, idx) => {
        const sku = skuMap.get(itemsArray.fields[idx]?.skuId ?? "");
        return line.sale ? { name: sku?.name ?? "Unknown SKU", qty: line.sale, amount: line.totalAmt } : null;
      })
      .filter((l): l is { name: string; qty: number; amount: number } => l !== null);
    const salesman = salesmen.find((s) => s._id === getValues("salesmanId"));
    const html = buildVoucherPrintHtml({
      businessName,
      currency,
      salesmanName: salesman?.name ?? "—",
      date: getValues("date"),
      skuLines,
      totals,
      cashCount,
    });
    if (!openPrintWindow(html)) toast.error("Please allow pop-ups to print.");
  }

  function focusNextItemRow(input: HTMLInputElement) {
    const field = input.dataset.field!;
    const group = Array.from(
      containerRef.current?.querySelectorAll<HTMLInputElement>(`[data-item][data-field="${field}"]`) ?? []
    );
    const idx = group.indexOf(input);
    if (idx >= 0 && idx < group.length - 1) group[idx + 1].focus();
  }

  function focusNextDenom(input: HTMLInputElement) {
    const den = Number(input.dataset.denom);
    const idx = DENOMINATIONS.indexOf(den as (typeof DENOMINATIONS)[number]);
    if (idx >= 0 && idx < DENOMINATIONS.length - 1) {
      containerRef.current
        ?.querySelector<HTMLInputElement>(`[data-denom="${DENOMINATIONS[idx + 1]}"]`)
        ?.focus();
    }
  }

  function focusNextListRow(input: HTMLInputElement, listName: SectionName) {
    const field = input.dataset.field as "label" | "amount";
    const idx = Number(input.dataset.idx);
    const api = sections[listName];
    if (idx < api.fields.length - 1) {
      containerRef.current
        ?.querySelector<HTMLInputElement>(`[data-list="${listName}"][data-idx="${idx + 1}"][data-field="${field}"]`)
        ?.focus();
    } else {
      api.append({ label: "", amount: 0 });
      requestAnimationFrame(() => {
        containerRef.current
          ?.querySelector<HTMLInputElement>(`[data-list="${listName}"][data-idx="${idx + 1}"][data-field="${field}"]`)
          ?.focus();
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;

    if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      const targetList = (active?.dataset.list as SectionName | undefined) ?? lastFocusedListRef.current;
      if (targetList && SECTION_CONFIG[targetList]) {
        const api = sections[targetList];
        const newIdx = api.fields.length;
        api.append({ label: "", amount: 0 });
        requestAnimationFrame(() => {
          containerRef.current
            ?.querySelector<HTMLInputElement>(`[data-list="${targetList}"][data-idx="${newIdx}"][data-field="label"]`)
            ?.focus();
        });
      }
      return;
    }

    if (e.key === "Enter" && target instanceof HTMLInputElement && target.type !== "date") {
      const list = target.dataset.list as SectionName | undefined;
      if (target.dataset.item !== undefined) {
        e.preventDefault();
        focusNextItemRow(target);
      } else if (target.dataset.denom !== undefined) {
        e.preventDefault();
        focusNextDenom(target);
      } else if (list && SECTION_CONFIG[list]) {
        e.preventDefault();
        focusNextListRow(target, list);
      }
    }
  }

  function handleFocusCapture(e: React.FocusEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.dataset.list) lastFocusedListRef.current = target.dataset.list as SectionName;
    if (
      target instanceof HTMLInputElement &&
      (target.type === "number" || target.type === "text") &&
      (target.dataset.item !== undefined ||
        target.dataset.denom !== undefined ||
        target.dataset.list !== undefined ||
        target.dataset.bindNum !== undefined)
    ) {
      requestAnimationFrame(() => {
        try {
          target.select();
        } catch {
          // ignore
        }
      });
    }
  }

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} onFocusCapture={handleFocusCapture}>
      <PageHeader
        title={mode === "edit" ? "Edit voucher" : "New voucher"}
        description="Pick a salesman, fill in stock movement, credit, cash and expenses, then save."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Salesman
              </label>
              <Controller
                control={control}
                name="salesmanId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      refreshAutofill(v, getValues("date"));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose salesman…" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesmen.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="voucherDate">
                Date
              </label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    id="voucherDate"
                    value={field.value}
                    clearable={false}
                    onChange={(v) => {
                      field.onChange(v);
                      refreshAutofill(getValues("salesmanId"), v);
                    }}
                  />
                )}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">Stock &amp; sale</h2>
            <AddSkuDialog
              onCreated={(sku) => {
                setSkus((prev) => [...prev, sku]);
                itemsArray.append({ skuId: sku._id, opening: 0, ret: 0, closing: 0, wholesaleQty: 0 });
              }}
            />
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Opening carries over automatically from the last voucher (plus anything received via
            Inventory).
          </p>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Closing</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Wholesale qty</TableHead>
                  <TableHead>Retail qty</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsArray.fields.map((field, idx) => (
                  <VoucherItemRow
                    key={field.id}
                    register={register}
                    index={idx}
                    skuId={field.skuId}
                    skuName={skuMap.get(field.skuId)?.name ?? "Unknown SKU"}
                    line={lines[idx]}
                    currency={currency}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <DynamicRowsSection
            register={register}
            listName="credits"
            title={SECTION_CONFIG.credits.title}
            placeholder={SECTION_CONFIG.credits.placeholder}
            fields={creditsArray.fields}
            onAddRow={() => creditsArray.append({ label: "", amount: 0 })}
            onRemoveRow={creditsArray.remove}
          />
        </section>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <DynamicRowsSection
            register={register}
            listName="cashReceived"
            title={SECTION_CONFIG.cashReceived.title}
            placeholder={SECTION_CONFIG.cashReceived.placeholder}
            fields={cashReceivedArray.fields}
            onAddRow={() => cashReceivedArray.append({ label: "", amount: 0 })}
            onRemoveRow={cashReceivedArray.remove}
          />
        </section>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <DynamicRowsSection
            register={register}
            listName="expenses"
            title={SECTION_CONFIG.expenses.title}
            placeholder={SECTION_CONFIG.expenses.placeholder}
            fields={expensesArray.fields}
            onAddRow={() => expensesArray.append({ label: "", amount: 0 })}
            onRemoveRow={expensesArray.remove}
          />
        </section>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <DynamicRowsSection
            register={register}
            listName="other"
            title={SECTION_CONFIG.other.title}
            placeholder={SECTION_CONFIG.other.placeholder}
            fields={otherArray.fields}
            onAddRow={() => otherArray.append({ label: "", amount: 0 })}
            onRemoveRow={otherArray.remove}
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <CashCountPanel register={register} cashCount={cashCount} currency={currency} />
        </section>

        <VoucherTotalsBar totals={totals} currency={currency} />

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/vouchers")}>
            Cancel
          </Button>
          {mode === "edit" && (
            <Button type="button" variant="outline" onClick={handlePrint}>
              Print voucher
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save voucher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
