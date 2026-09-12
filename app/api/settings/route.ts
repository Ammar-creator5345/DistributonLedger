import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiServerError, apiSuccess, apiValidationError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { settingsSchema } from "@/schemas/settings";
import { getSettings } from "@/lib/settings";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (err) {
    return apiServerError(err);
  }
}

const patchSchema = settingsSchema.partial().extend({
  // Optional — leave blank/omitted to keep the current admin password, matching the source app.
  newAdminPassword: z.string().min(1).max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    const { newAdminPassword, ...fields } = parsed.data;

    await connectToDatabase();
    let doc = await Settings.findOne();
    if (!doc) doc = new Settings();
    Object.assign(doc, fields);
    if (newAdminPassword) doc.adminPassword = newAdminPassword;
    await doc.save();

    // Never echo adminPassword back to the client.
    const plain = JSON.parse(JSON.stringify(doc));
    delete plain.adminPassword;
    return apiSuccess(plain);
  } catch (err) {
    return apiServerError(err);
  }
}
