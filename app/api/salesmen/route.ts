import { NextRequest } from "next/server";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Salesman } from "@/models/Salesman";
import { salesmanSchema } from "@/schemas/salesman";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    await connectToDatabase();
    const salesmen = await Salesman.find().sort({ name: 1 }).lean();
    return apiSuccess(JSON.parse(JSON.stringify(salesmen)));
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = salesmanSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    const salesman = await Salesman.create(parsed.data);
    return apiSuccess(JSON.parse(JSON.stringify(salesman)), 201);
  } catch (err) {
    return apiServerError(err);
  }
}
