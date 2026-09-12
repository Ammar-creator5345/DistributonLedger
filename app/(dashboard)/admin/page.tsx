import type { Metadata } from "next";
import { PageHeader } from "@/components/ledger/page-header";
import { AdminGate } from "@/components/admin/admin-gate";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { SalesmenPanel } from "@/components/admin/salesmen-panel";
import { SkusPanel } from "@/components/admin/skus-panel";
import { OpeningStockPanel } from "@/components/admin/opening-stock-panel";
import { BackupPanel } from "@/components/admin/backup-panel";
import { getSettings } from "@/lib/settings";
import { connectToDatabase } from "@/lib/db";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { InventoryOpeningBase } from "@/models/InventoryOpeningBase";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await connectToDatabase();
  const [settings, salesmen, skus, openingBaseDocs] = await Promise.all([
    getSettings(),
    Salesman.find().sort({ name: 1 }).lean(),
    Sku.find().sort({ name: 1 }).lean(),
    InventoryOpeningBase.find().lean(),
  ]);

  const openingBase: Record<string, number> = {};
  for (const doc of openingBaseDocs) {
    openingBase[String(doc.skuId)] = doc.qty;
  }

  return (
    <AdminGate>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader
          title="Admin"
          description="Manage business settings, salesmen and the price list. Changes apply immediately across the app."
        />
        <SettingsPanel initial={settings} />
        <SalesmenPanel initial={JSON.parse(JSON.stringify(salesmen))} />
        <SkusPanel initial={JSON.parse(JSON.stringify(skus))} />
        <OpeningStockPanel
          skus={JSON.parse(JSON.stringify(skus)).map((s: { _id: string; name: string }) => ({
            _id: s._id,
            name: s.name,
          }))}
          initialBase={openingBase}
        />
        <BackupPanel />
      </div>
    </AdminGate>
  );
}
