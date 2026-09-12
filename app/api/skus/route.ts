import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Sku } from "@/models/Sku";
import { skuSchema } from "@/schemas/sku";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    await connectToDatabase();
    const skus = await Sku.find().sort({ name: 1 }).lean();
    return apiSuccess(JSON.parse(JSON.stringify(skus)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = skuSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const sku = await Sku.create(parsed.data);
    return apiSuccess(JSON.parse(JSON.stringify(sku)), 201);
  } catch (err) {
    return apiServerError(err);
  }
}
