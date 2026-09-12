import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Sku } from "@/models/Sku";
import { getInventoryMovementForSkus } from "@/lib/inventory-service";
import { inventoryRangeBounds } from "@/lib/calculations";
import { todayStr } from "@/lib/format";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const skuId = searchParams.get("skuId") || undefined;

    await connectToDatabase();
    const skus = skuId
      ? await Sku.find({ _id: skuId }).lean()
      : await Sku.find().sort({ name: 1 }).lean();
    const skuIds = skus.map((s) => String(s._id));

    const [boundFrom, boundTo] = inventoryRangeBounds({ from, to }, todayStr());
    const movement = await getInventoryMovementForSkus(skuIds, boundFrom, boundTo);

    const rows = skus.map((s) => ({
      skuId: String(s._id),
      name: s.name,
      ...movement[String(s._id)],
    }));

    return apiSuccess({ from: boundFrom, to: boundTo, rows });
  } catch (err) {
    return apiServerError(err);
  }
}
