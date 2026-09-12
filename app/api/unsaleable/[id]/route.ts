import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { UnsaleableSale } from "@/models/UnsaleableSale";
import { objectIdString } from "@/schemas/salesman";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  const { id } = await params;
  if (!objectIdString.safeParse(id).success) return apiError("Invalid id", 400);

  try {
    await connectToDatabase();
    const deleted = await UnsaleableSale.findByIdAndDelete(id).lean();
    if (!deleted) return apiError("Not found", 404);
    return apiSuccess({ id });
  } catch (err) {
    return apiServerError(err);
  }
}
