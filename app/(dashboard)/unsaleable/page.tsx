import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Sku } from "@/models/Sku";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { UnsaleableClient } from "@/components/unsaleable/unsaleable-client";

export const metadata: Metadata = {
  title: "Unsaleable Stock Sale",
};

export default async function UnsaleablePage() {
  await connectToDatabase();
  const [settings, skus, sales] = await Promise.all([
    getSettings(),
    Sku.find().sort({ name: 1 }).lean(),
    UnsaleableSale.find().sort({ date: -1 }).lean(),
  ]);

  return (
    <UnsaleableClient
      skus={JSON.parse(JSON.stringify(skus)).map(
        (s: { _id: string; name: string; distRate: number; retailRate: number; wholesaleRate: number }) => ({
          _id: s._id,
          id: s._id,
          name: s.name,
          distRate: s.distRate,
          retailRate: s.retailRate,
          wholesaleRate: s.wholesaleRate,
        })
      )}
      currency={settings.currency}
      initialSales={JSON.parse(JSON.stringify(sales))}
    />
  );
}
