import * as XLSX from "xlsx";
import { apiError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);

  const data = [
    ["Category", "SKU", "Distributor Rate", "Retail Rate", "Wholesale Rate"],
    ["FMC", "SKU 1", 90, 100, 95],
    ["NC", "SKU 2", 180, 200, 190],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Price List Template");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Price_List_Template.xlsx"',
    },
  });
}
