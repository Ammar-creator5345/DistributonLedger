import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import {
  getCashReport,
  getExpensesReport,
  getOtherReport,
  getProfitReport,
  getQtyReport,
  getRevenueReport,
} from "@/lib/reports-service";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") ?? "sales";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const salesmanId = searchParams.get("salesmanId") || undefined;
    const groupBy = searchParams.get("groupBy") === "salesman" ? "salesman" : "sku";
    const cashView = searchParams.get("cashView") === "summary" ? "summary" : "detail";

    await connectToDatabase();

    switch (tab) {
      case "sales":
        return apiSuccess(await getQtyReport(from, to, salesmanId, groupBy));
      case "revenue":
        return apiSuccess(await getRevenueReport(from, to, salesmanId, groupBy));
      case "profit":
        return apiSuccess(await getProfitReport(from, to, salesmanId, groupBy));
      case "expenses":
        return apiSuccess(await getExpensesReport(from, to, salesmanId));
      case "other":
        return apiSuccess(await getOtherReport(from, to, salesmanId));
      case "cash":
        return apiSuccess(await getCashReport(from, to, salesmanId, cashView));
      default:
        return apiError("Unknown report tab", 400);
    }
  } catch (err) {
    return apiServerError(err);
  }
}
