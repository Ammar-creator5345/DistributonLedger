import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Salesman } from "@/models/Salesman";
import { getQtyReport } from "@/lib/reports-service";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  await connectToDatabase();
  const [settings, salesmen, initialQtyRows] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    getQtyReport(undefined, undefined, undefined, "sku"),
  ]);

  return (
    <ReportsClient
      salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      currency={settings.currency}
      initialQtyRows={initialQtyRows}
    />
  );
}
