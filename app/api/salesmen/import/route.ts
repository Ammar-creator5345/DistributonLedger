import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Salesman } from "@/models/Salesman";
import { salesmanImportRowSchema } from "@/schemas/salesman";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!(await requireSession())) return apiError("Unauthorized", 401);

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return apiError("No file uploaded", 400);
    if (file.size > MAX_IMPORT_BYTES) return apiError("File is too large (max 5MB)", 400);
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return apiError("Only .xlsx or .xls files are supported", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    await connectToDatabase();
    const existing = await Salesman.find().select("name").lean();
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];
    const toInsert: { name: string; filerCategory: "" | "Filer" | "Non-Filer" }[] = [];

    rows.forEach((row, idx) => {
      const keys: Record<string, unknown> = {};
      Object.keys(row).forEach((k) => (keys[k.trim().toLowerCase()] = row[k]));

      const parsed = salesmanImportRowSchema.safeParse({
        name: String(keys["name"] ?? "").trim(),
        filerCategory: String(keys["filer category"] ?? "").trim(),
      });

      if (!parsed.success) {
        errors.push(`Row ${idx + 2}: ${parsed.error.issues[0]?.message ?? "invalid row"}`);
        return;
      }

      const key = parsed.data.name.toLowerCase();
      if (existingNames.has(key)) {
        skipped++;
        return;
      }
      existingNames.add(key);
      toInsert.push(parsed.data);
      added++;
    });

    if (toInsert.length) await Salesman.insertMany(toInsert);

    return apiSuccess({ added, skipped, errors });
  } catch (err) {
    return apiServerError(err);
  }
}
