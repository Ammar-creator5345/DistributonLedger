import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { Voucher } from "@/models/Voucher";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import type { VoucherInput } from "@/schemas/voucher";

export const metadata: Metadata = {
  title: "Edit voucher",
};

interface VoucherLean {
  _id: unknown;
  date: string;
  salesmanId: unknown;
  items: { skuId: unknown; opening?: number; ret?: number; closing?: number; wholesaleQty?: number }[];
  credits?: { label?: string; amount?: number }[];
  cashReceived?: { label?: string; amount?: number }[];
  expenses?: { label?: string; amount?: number; receiptUrl?: string }[];
  other?: { label?: string; amount?: number }[];
  cashCount?: Record<string, number>;
  mcb?: number;
}

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectToDatabase();

  const [settings, salesmen, skus, voucher] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
    Voucher.findById(id).lean(),
  ]);

  if (!voucher) notFound();
  const v = voucher as unknown as VoucherLean;

  const initialValues: VoucherInput = {
    date: v.date,
    salesmanId: String(v.salesmanId),
    items: v.items.map((it) => ({
      skuId: String(it.skuId),
      opening: it.opening ?? 0,
      ret: it.ret ?? 0,
      closing: it.closing ?? 0,
      wholesaleQty: it.wholesaleQty ?? 0,
    })),
    credits: (v.credits ?? []).map((r) => ({ label: r.label ?? "", amount: r.amount ?? 0 })),
    cashReceived: (v.cashReceived ?? []).map((r) => ({
      label: r.label ?? "",
      amount: r.amount ?? 0,
    })),
    expenses: (v.expenses ?? []).map((r) => ({
      label: r.label ?? "",
      amount: r.amount ?? 0,
      receiptUrl: r.receiptUrl ?? undefined,
    })),
    other: (v.other ?? []).map((r) => ({ label: r.label ?? "", amount: r.amount ?? 0 })),
    cashCount: {
      d5000: v.cashCount?.d5000 ?? 0,
      d1000: v.cashCount?.d1000 ?? 0,
      d500: v.cashCount?.d500 ?? 0,
      d100: v.cashCount?.d100 ?? 0,
      d75: v.cashCount?.d75 ?? 0,
      d50: v.cashCount?.d50 ?? 0,
      d20: v.cashCount?.d20 ?? 0,
      d10: v.cashCount?.d10 ?? 0,
    },
    mcb: v.mcb ?? 0,
  };

  return (
    <VoucherForm
      mode="edit"
      voucherId={String(voucher._id)}
      initialValues={initialValues}
      skus={JSON.parse(JSON.stringify(skus)).map(
        (s: { _id: string; name: string; distRate: number; retailRate: number; wholesaleRate: number; category: string }) => ({
          _id: s._id,
          id: s._id,
          name: s.name,
          distRate: s.distRate,
          retailRate: s.retailRate,
          wholesaleRate: s.wholesaleRate,
          category: s.category,
        })
      )}
      salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      currency={settings.currency}
      businessName={settings.businessName}
    />
  );
}
