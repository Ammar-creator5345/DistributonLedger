import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";
import type { SettingsInput } from "@/schemas/settings";

/** Public-facing settings — never includes adminPassword. Use verifyAdminPassword() for the gate. */
export async function getSettings(): Promise<SettingsInput & { _id: string }> {
  await connectToDatabase();
  let doc = await Settings.findOne().lean();
  if (!doc) {
    const created = await Settings.create({});
    doc = created.toObject();
  }
  const plain = JSON.parse(JSON.stringify(doc));
  delete plain.adminPassword;
  return plain;
}
