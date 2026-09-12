import * as XLSX from "xlsx";
import { apiError } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  if (!(await requireSession())) return apiError("Unauthorized", 401);

  const data = [["Name"], ["Salesman 1"], ["Salesman 2"]];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Salesmen Template");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Salesmen_Template.xlsx"',
    },
  });
}
