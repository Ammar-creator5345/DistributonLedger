import { z } from "zod";
import { objectIdString } from "@/schemas/salesman";
import { dateStringSchema } from "@/schemas/voucher";

export const inventoryEntrySchema = z.object({
  date: dateStringSchema,
  skuId: objectIdString,
  relatedSalesmanId: objectIdString.optional(),
  received: z.number().min(0),
  damage: z.number().min(0),
  unsaleableQty: z.number().min(0),
  unsaleableReason: z.string().trim().max(300).optional(),
  reference: z.string().trim().max(200).optional(),
});

export type InventoryEntryInput = z.infer<typeof inventoryEntrySchema>;

export const inventoryOpeningBaseSchema = z.object({
  skuId: objectIdString,
  qty: z.number().min(0, "Opening quantity cannot be negative"),
});

export type InventoryOpeningBaseInput = z.infer<typeof inventoryOpeningBaseSchema>;

export const inventoryFilterSchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  skuId: objectIdString.optional(),
});

export type InventoryFilter = z.infer<typeof inventoryFilterSchema>;
