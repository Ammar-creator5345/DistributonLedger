import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { Sku } from "@/models/Sku";
import { unsaleableSaleSchema } from "@/schemas/unsaleable";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, unknown>).$gte = from;
      if (to) (query.date as Record<string, unknown>).$lte = to;
    }

    const sales = await UnsaleableSale.find(query).sort({ date: -1 }).lean();
    return apiSuccess(JSON.parse(JSON.stringify(sales)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = unsaleableSaleSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const skuExists = await Sku.exists({ _id: parsed.data.skuId });
    if (!skuExists) return apiError("SKU not found", 404);

    const sale = await UnsaleableSale.create(parsed.data);
    return apiSuccess(JSON.parse(JSON.stringify(sale)), 201);
  } catch (err) {
    return apiServerError(err);
  }
}
