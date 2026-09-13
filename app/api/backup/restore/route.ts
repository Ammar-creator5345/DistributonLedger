import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { Voucher } from "@/models/Voucher";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { InventoryEntry } from "@/models/InventoryEntry";
import { InventoryOpeningBase } from "@/models/InventoryOpeningBase";

/** Restores a full backup (the exact shape GET /api/backup produces) — replaces each collection
 * wholesale so referenced _ids (salesmanId/skuId on vouchers etc.) stay consistent. */
export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    await connectToDatabase();

    if (body.settings) {
      await Settings.deleteMany({});
      await Settings.create(body.settings);
    }
    if (Array.isArray(body.salesmen)) {
      await Salesman.deleteMany({});
      if (body.salesmen.length) await Salesman.insertMany(body.salesmen);
    }
    if (Array.isArray(body.skus)) {
      await Sku.deleteMany({});
      if (body.skus.length) await Sku.insertMany(body.skus);
    }
    if (Array.isArray(body.vouchers)) {
      await Voucher.deleteMany({});
      if (body.vouchers.length) await Voucher.insertMany(body.vouchers);
    }
    if (Array.isArray(body.unsaleableSales)) {
      await UnsaleableSale.deleteMany({});
      if (body.unsaleableSales.length) await UnsaleableSale.insertMany(body.unsaleableSales);
    }
    if (body.inventory) {
      if (Array.isArray(body.inventory.openingBase)) {
        await InventoryOpeningBase.deleteMany({});
        if (body.inventory.openingBase.length) await InventoryOpeningBase.insertMany(body.inventory.openingBase);
      }
      if (Array.isArray(body.inventory.entries)) {
        await InventoryEntry.deleteMany({});
        if (body.inventory.entries.length) await InventoryEntry.insertMany(body.inventory.entries);
      }
    }

    return apiSuccess({ restored: true });
  } catch (err) {
    return apiServerError(err);
  }
}
