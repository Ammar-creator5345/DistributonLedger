import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { Voucher } from "@/models/Voucher";
import { PageHeader } from "@/components/ledger/page-header";
import { VouchersTable } from "@/components/vouchers/vouchers-table";

export const metadata: Metadata = {
  title: "Vouchers",
};

export default async function VouchersPage() {
  await connectToDatabase();
  const [settings, salesmen, skus, vouchers] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
    Voucher.find().sort({ date: -1, createdAt: -1 }).lean(),
  ]);

  return (
    <div>
      <PageHeader title="Vouchers" description={`${vouchers.length} voucher(s)`} />
      <VouchersTable
        initialVouchers={JSON.parse(JSON.stringify(vouchers))}
        salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
          _id: s._id,
          name: s.name,
        }))}
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
        currency={settings.currency}
        businessName={settings.businessName}
      />
    </div>
  );
}
