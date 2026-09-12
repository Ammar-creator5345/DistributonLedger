import { z } from "zod";
import { objectIdString } from "@/schemas/salesman";
import { dateStringSchema } from "@/schemas/voucher";

export const reportsFilterSchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  salesmanId: objectIdString.optional(),
  groupBy: z.enum(["sku", "salesman"]).default("sku"),
});

export type ReportsFilter = z.infer<typeof reportsFilterSchema>;
