import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { Voucher } from "@/models/Voucher";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { dashboardRange } from "@/lib/calculations";
import { todayStr } from "@/lib/format";
import {
  getRevenueReport,
  getProfitReport,
  getExpensesReport,
} from "@/lib/reports-service";
import { getCreditBook } from "@/lib/credit-book-service";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await connectToDatabase();
  const [from, to] = dashboardRange({}, todayStr());

  const [settings, salesmen, skus] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
  ]);

  const [revenueBySku, revenueBySalesman, profitBySku, expenseRows, creditPeople, unsaleableSales, vouchers] =
    await Promise.all([
      getRevenueReport(from, to, undefined, "sku"),
      getRevenueReport(from, to, undefined, "salesman"),
      getProfitReport(from, to, undefined, "sku"),
      getExpensesReport(from, to, undefined),
      getCreditBook(from, to),
      UnsaleableSale.find({ date: { $gte: from, $lte: to } }).lean(),
      Voucher.find({ date: { $gte: from, $lte: to } })
        .sort({ date: -1, createdAt: -1 })
        .lean(),
    ]);

  return (
    <DashboardClient
      businessName={settings.businessName}
      currency={settings.currency}
      salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      skus={JSON.parse(JSON.stringify(skus))}
      initial={{
        from,
        to,
        revenueBySku,
        revenueBySalesman,
        profitBySku,
        expenseRows,
        creditPeople,
        unsaleableSales: JSON.parse(JSON.stringify(unsaleableSales)),
        vouchers: JSON.parse(JSON.stringify(vouchers)),
      }}
    />
  );
}
