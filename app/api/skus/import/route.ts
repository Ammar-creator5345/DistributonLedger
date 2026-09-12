import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { apiError, apiServerError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { connectToDatabase } from "@/lib/db";
import { Sku } from "@/models/Sku";

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
    const existing = await Sku.find().select("name").lean();
    const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s._id]));

    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const keys: Record<string, unknown> = {};
      Object.keys(row).forEach((k) => (keys[k.trim().toLowerCase()] = row[k]));

      const name = String(keys["sku"] ?? "").trim();
      const categoryRaw = String(keys["category"] ?? "").trim().toUpperCase();
      const category: "" | "FMC" | "NC" = categoryRaw === "FMC" || categoryRaw === "NC" ? categoryRaw : "";
      const distRate = Number(keys["distributor rate"]);
      const retailRate = Number(keys["retail rate"]);
      const wholesaleRate = Number(keys["wholesale rate"]);

      if (!name) {
        errors.push(`Row ${idx + 2}: missing SKU name.`);
        continue;
      }
      if (
        Number.isNaN(distRate) || distRate < 0 ||
        Number.isNaN(retailRate) || retailRate < 0 ||
        Number.isNaN(wholesaleRate) || wholesaleRate < 0
      ) {
        errors.push(`Row ${idx + 2}: invalid Distributor/Retail/Wholesale rate.`);
        continue;
      }

      const key = name.toLowerCase();
      const existingId = byName.get(key);
      if (existingId) {
        await Sku.updateOne(
          { _id: existingId },
          { $set: { distRate, retailRate, wholesaleRate, ...(category ? { category } : {}) } }
        );
        updated++;
      } else {
        const created = await Sku.create({ name, category, distRate, retailRate, wholesaleRate });
        byName.set(key, created._id);
        added++;
      }
    }

    return apiSuccess({ added, updated, errors });
  } catch (err) {
    return apiServerError(err);
  }
}
