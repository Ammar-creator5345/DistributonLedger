import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { computeOpeningAutofill } from "@/lib/voucher-service";
import { VoucherForm } from "@/components/vouchers/voucher-form";
import type { VoucherInput } from "@/schemas/voucher";

export const metadata: Metadata = {
  title: "New voucher",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewVoucherPage() {
  await connectToDatabase();
  const [settings, salesmen, skus] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
  ]);

  const date = todayStr();
  const salesmanId = salesmen[0] ? String(salesmen[0]._id) : "";
  const skuIds = skus.map((s) => String(s._id));
  const opening = salesmanId ? await computeOpeningAutofill(salesmanId, date, skuIds) : {};

  const initialValues: VoucherInput = {
    date,
    salesmanId,
    items: skus.map((s) => ({
      skuId: String(s._id),
      opening: opening[String(s._id)] ?? 0,
      ret: 0,
      closing: 0,
      wholesaleQty: 0,
    })),
    credits: [],
    cashReceived: [],
    expenses: [],
    other: [],
    cashCount: { d5000: 0, d1000: 0, d500: 0, d100: 0, d75: 0, d50: 0, d20: 0, d10: 0 },
    mcb: 0,
  };

  return (
    <VoucherForm
      mode="new"
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
