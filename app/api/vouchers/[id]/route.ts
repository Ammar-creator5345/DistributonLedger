import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { voucherSchema } from "@/schemas/voucher";
import { objectIdString } from "@/schemas/salesman";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    await connectToDatabase();
    const voucher = await Voucher.findById(id).lean();
    if (!voucher) return apiError("Voucher not found", 404);
    return apiSuccess(JSON.parse(JSON.stringify(voucher)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    const body = await req.json();
    const parsed = voucherSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    const data = parsed.data;

    await connectToDatabase();

    const salesmanExists = await Salesman.exists({ _id: data.salesmanId });
    if (!salesmanExists) return apiError("Salesman not found", 404);

    const skuIds = data.items.map((it) => it.skuId);
    const skuCount = await Sku.countDocuments({ _id: { $in: skuIds } });
    if (skuCount !== new Set(skuIds).size) {
      return apiError("One or more SKUs on this voucher no longer exist", 400);
    }

    const voucher = await Voucher.findByIdAndUpdate(id, data, { returnDocument: "after" }).lean();
    if (!voucher) return apiError("Voucher not found", 404);
    return apiSuccess(JSON.parse(JSON.stringify(voucher)));
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
    const deleted = await Voucher.findByIdAndDelete(id).lean();
    if (!deleted) return apiError("Voucher not found", 404);
    return apiSuccess({ id });
  } catch (err) {
    return apiServerError(err);
  }
}
