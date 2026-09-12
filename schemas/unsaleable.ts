import { z } from "zod";
import { objectIdString } from "@/schemas/salesman";
import { dateStringSchema } from "@/schemas/voucher";

export const unsaleableCategorySchema = z.enum(["retail", "wholesale", "distributor"]);

export const unsaleableSaleSchema = z.object({
  date: dateStringSchema,
  skuId: objectIdString,
  category: unsaleableCategorySchema,
  qty: z.number().positive("Quantity must be greater than 0"),
});

export type UnsaleableSaleInput = z.infer<typeof unsaleableSaleSchema>;
