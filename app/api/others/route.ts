import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Voucher } from "@/models/Voucher";
import { Salesman } from "@/models/Salesman";

/**
 * Standalone, read-only listing of every voucher's "Other" rows — a dedicated view separate
 * from Reports > Other, added in source app v1.126. Purely informational; it doesn't affect any
 * totals or calculations elsewhere.
 */
export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const salesmanId = searchParams.get("salesmanId") || undefined;

    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, unknown>).$gte = from;
      if (to) (query.date as Record<string, unknown>).$lte = to;
    }
    if (salesmanId) query.salesmanId = salesmanId;

    const [vouchers, salesmen] = await Promise.all([
      Voucher.find(query).select("date salesmanId other").lean(),
      Salesman.find().select("name").lean(),
    ]);
    const salesmanMap = new Map(salesmen.map((s) => [String(s._id), s.name]));

    const rows: { date: string; salesman: string; label: string; amount: number }[] = [];
    for (const v of vouchers) {
      for (const r of v.other ?? []) {
        if (!r.label && !r.amount) continue;
        rows.push({
          date: v.date,
          salesman: salesmanMap.get(String(v.salesmanId)) ?? "—",
          label: r.label || "(unnamed)",
          amount: Number(r.amount) || 0,
        });
      }
    }
    rows.sort((a, b) => (b.date < a.date ? -1 : 1));

    return apiSuccess(rows);
  } catch (err) {
    return apiServerError(err);
  }
}
