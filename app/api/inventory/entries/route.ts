import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { InventoryEntry } from "@/models/InventoryEntry";
import { Sku } from "@/models/Sku";
import { Salesman } from "@/models/Salesman";
import { inventoryEntrySchema } from "@/schemas/inventory";
import { inventoryRangeBounds } from "@/lib/calculations";
import { todayStr } from "@/lib/format";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const skuId = searchParams.get("skuId") || undefined;
    const kind = searchParams.get("kind") === "unsaleable" ? "unsaleable" : "receiving";

    await connectToDatabase();
    const [boundFrom, boundTo] = inventoryRangeBounds({ from, to }, todayStr());

    const query: Record<string, unknown> = { date: { $gte: boundFrom, $lte: boundTo } };
    if (skuId) query.skuId = skuId;
    if (kind === "receiving") query.received = { $gt: 0 };
    else query.unsaleableQty = { $gt: 0 };

    const entries = await InventoryEntry.find(query).sort({ date: -1 }).lean();
    return apiSuccess(JSON.parse(JSON.stringify(entries)));
  } catch (err) {
    return apiServerError(err);
  }
}

/** Upserts the (date, skuId) inventory entry — matches the source app's save-inventory-entry action. */
export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = inventoryEntrySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    const data = parsed.data;

    await connectToDatabase();

    const skuExists = await Sku.exists({ _id: data.skuId });
    if (!skuExists) return apiError("SKU not found", 404);
    if (data.relatedSalesmanId) {
      const salesmanExists = await Salesman.exists({ _id: data.relatedSalesmanId });
      if (!salesmanExists) return apiError("Salesman not found", 404);
    }

    const entry = await InventoryEntry.findOneAndUpdate(
      { date: data.date, skuId: data.skuId },
      {
        relatedSalesmanId: data.relatedSalesmanId || undefined,
        received: data.received,
        damage: data.damage,
        unsaleableQty: data.unsaleableQty,
        unsaleableReason: data.unsaleableReason,
        reference: data.reference,
      },
      { upsert: true, returnDocument: "after" }
    ).lean();

    return apiSuccess(JSON.parse(JSON.stringify(entry)));
  } catch (err) {
    return apiServerError(err);
  }
}
