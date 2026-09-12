import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Salesman } from "@/models/Salesman";
import { salesmanSchema, objectIdString } from "@/schemas/salesman";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    const body = await req.json();
    const parsed = salesmanSchema.partial().safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const salesman = await Salesman.findByIdAndUpdate(id, parsed.data, {
      returnDocument: "after",
    }).lean();
    if (!salesman) return apiError("Salesman not found", 404);
    return apiSuccess(JSON.parse(JSON.stringify(salesman)));
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
    const usedInVoucher = await Voucher.exists({ salesmanId: id });
    if (usedInVoucher) {
      return apiError(
        "This salesman has vouchers on record and can't be deleted. Deactivate them instead.",
        409
      );
    }

    const deleted = await Salesman.findByIdAndDelete(id).lean();
    if (!deleted) return apiError("Salesman not found", 404);
    return apiSuccess({ id });
  } catch (err) {
    return apiServerError(err);
  }
}
