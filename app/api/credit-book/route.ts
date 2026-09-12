import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { getCreditBook } from "@/lib/credit-book-service";

export async function GET(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    await connectToDatabase();
    const people = await getCreditBook(from, to);
    return apiSuccess(people);
  } catch (err) {
    return apiServerError(err);
  }
}
