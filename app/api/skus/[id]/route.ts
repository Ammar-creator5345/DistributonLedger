import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Sku } from "@/models/Sku";
import { skuSchema } from "@/schemas/sku";
import { objectIdString } from "@/schemas/salesman";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    const body = await req.json();
    const parsed = skuSchema.partial().safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const sku = await Sku.findByIdAndUpdate(id, parsed.data, { returnDocument: "after" }).lean();
    if (!sku) return apiError("SKU not found", 404);
    return apiSuccess(JSON.parse(JSON.stringify(sku)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    await connectToDatabase();

    const { Voucher } = await import("@/models/Voucher");
    const usedInVoucher = await Voucher.exists({ "items.skuId": id });
    if (usedInVoucher) {
      return apiError("This SKU has voucher history and can't be deleted.", 409);
    }

    const deleted = await Sku.findByIdAndDelete(id).lean();
    if (!deleted) return apiError("SKU not found", 404);
    return apiSuccess({ id });
  } catch (err) {
    return apiServerError(err);
  }
}
