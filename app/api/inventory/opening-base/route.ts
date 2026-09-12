import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { InventoryOpeningBase } from "@/models/InventoryOpeningBase";
import { inventoryOpeningBaseSchema } from "@/schemas/inventory";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    await connectToDatabase();
    const docs = await InventoryOpeningBase.find().lean();
    return apiSuccess(JSON.parse(JSON.stringify(docs)));
  } catch (err) {
    return apiServerError(err);
  }
}

/** Upsert — one opening-base record per SKU, matching the source app's one-time setup table. */
export async function PUT(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = inventoryOpeningBaseSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const doc = await InventoryOpeningBase.findOneAndUpdate(
      { skuId: parsed.data.skuId },
      { qty: parsed.data.qty },
      { upsert: true, returnDocument: "after" }
    ).lean();

    return apiSuccess(JSON.parse(JSON.stringify(doc)));
  } catch (err) {
    return apiServerError(err);
  }
}
