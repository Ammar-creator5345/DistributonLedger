import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";

const bodySchema = z.object({ password: z.string().min(1) });

/**
 * Verifies the Admin-panel password without ever sending the real value to the client — matching
 * the source app's admin gate (default "admin456"), but without exposing it via GET /api/settings.
 */
export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    await connectToDatabase();
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    if (parsed.data.password !== settings.adminPassword) {
      return apiError("Incorrect password", 401);
    }
    return apiSuccess({ unlocked: true });
  } catch (err) {
    return apiServerError(err);
  }
}
