import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Sku } from "@/models/Sku";
import { computeOpeningAutofill } from "@/lib/voucher-service";
import { objectIdString } from "@/schemas/salesman";
import { dateStringSchema } from "@/schemas/voucher";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const salesmanId = searchParams.get("salesmanId") ?? "";
    const date = searchParams.get("date") ?? "";
    const excludeId = searchParams.get("excludeId") ?? undefined;

    if (!objectIdString.safeParse(salesmanId).success) return apiError("Invalid salesmanId", 400);
    if (!dateStringSchema.safeParse(date).success) return apiError("Invalid date", 400);

    await connectToDatabase();
    const skus = await Sku.find().select("_id").lean();
    const skuIds = skus.map((s) => String(s._id));

    const opening = await computeOpeningAutofill(salesmanId, date, skuIds, excludeId);
    return apiSuccess(opening);
  } catch (err) {
    return apiServerError(err);
  }
}
