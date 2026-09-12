import { apiError, apiServerError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { Voucher } from "@/models/Voucher";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { InventoryEntry } from "@/models/InventoryEntry";
import { InventoryOpeningBase } from "@/models/InventoryOpeningBase";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    await connectToDatabase();
    const [settings, salesmen, skus, vouchers, unsaleableSales, inventoryEntries, openingBase] =
      await Promise.all([
        Settings.findOne().lean(),
        Salesman.find().lean(),
        Sku.find().lean(),
        Voucher.find().lean(),
        UnsaleableSale.find().lean(),
        InventoryEntry.find().lean(),
        InventoryOpeningBase.find().lean(),
      ]);

    const backup = {
      savedAt: new Date().toISOString(),
      settings,
      salesmen,
      skus,
      vouchers,
      unsaleableSales,
      inventory: { openingBase, entries: inventoryEntries },
    };

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="Backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return apiServerError(err);
  }
}
