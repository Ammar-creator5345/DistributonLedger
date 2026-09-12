import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { Voucher } from "@/models/Voucher";
import { OthersClient } from "@/components/others/others-client";

export const metadata: Metadata = {
  title: "Others",
};

export default async function OthersPage() {
  await connectToDatabase();
  const [settings, salesmen, vouchers] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Voucher.find().select("date salesmanId other").lean(),
  ]);

  const salesmanMap = new Map(salesmen.map((s) => [String(s._id), s.name]));
  const rows: { date: string; salesman: string; label: string; amount: number }[] = [];
  for (const v of vouchers) {
    for (const r of v.other ?? []) {
      if (!r.label && !r.amount) continue;
      rows.push({
        date: v.date,
        salesman: salesmanMap.get(String(v.salesmanId)) ?? "—",
        label: r.label || "(unnamed)",
        amount: Number(r.amount) || 0,
      });
    }
  }
  rows.sort((a, b) => (b.date < a.date ? -1 : 1));

  return (
    <OthersClient
      salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      currency={settings.currency}
      initialRows={rows}
    />
  );
}
