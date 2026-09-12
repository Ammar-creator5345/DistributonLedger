import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { Salesman } from "@/models/Salesman";
import { Sku } from "@/models/Sku";
import { voucherSchema, vouchersFilterSchema } from "@/schemas/voucher";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const parsed = vouchersFilterSchema.safeParse({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      salesmanId: searchParams.get("salesmanId") || undefined,
    });
    if (!parsed.success) return apiValidationError(parsed.error);
    const { from, to, salesmanId } = parsed.data;

    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, unknown>).$gte = from;
      if (to) (query.date as Record<string, unknown>).$lte = to;
    }
    if (salesmanId) query.salesmanId = salesmanId;

    const vouchers = await Voucher.find(query).sort({ date: -1, createdAt: -1 }).lean();
    return apiSuccess(JSON.parse(JSON.stringify(vouchers)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
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

    const voucher = await Voucher.create(data);
    return apiSuccess(JSON.parse(JSON.stringify(voucher)), 201);
  } catch (err) {
    return apiServerError(err);
  }
}
