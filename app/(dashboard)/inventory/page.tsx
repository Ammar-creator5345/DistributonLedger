import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { getInventoryMovementForSkus } from "@/lib/inventory-service";
import { inventoryRangeBounds } from "@/lib/calculations";
import { todayStr } from "@/lib/format";
import { InventoryClient } from "@/components/inventory/inventory-client";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function InventoryPage() {
  await connectToDatabase();
  const [salesmen, skus] = await Promise.all([
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
  ]);

  const skuIds = skus.map((s) => String(s._id));
  const [from, to] = inventoryRangeBounds({}, todayStr());
  const movement = await getInventoryMovementForSkus(skuIds, from, to);

  const rows = skus.map((s) => ({
    skuId: String(s._id),
    name: s.name,
    ...movement[String(s._id)],
  }));

  return (
    <InventoryClient
      skus={JSON.parse(JSON.stringify(skus)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      salesmen={JSON.parse(JSON.stringify(salesmen)).map((s: { _id: string; name: string }) => ({
        _id: s._id,
        name: s.name,
      }))}
      initialMovement={{ from, to, rows: JSON.parse(JSON.stringify(rows)) }}
    />
  );
}
