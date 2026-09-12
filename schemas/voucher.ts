import { z } from "zod";
import { objectIdString } from "@/schemas/salesman";

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const voucherItemSchema = z.object({
  skuId: objectIdString,
  opening: z.number().min(0, "Opening cannot be negative"),
  ret: z.number().min(0, "Return cannot be negative"),
  closing: z.number().min(0, "Closing cannot be negative"),
  wholesaleQty: z.number().min(0, "Wholesale qty cannot be negative"),
});

export const amountRowSchema = z.object({
  label: z.string().trim().max(200),
  amount: z.number(),
});

export const expenseRowSchema = z.object({
  label: z.string().trim().max(200),
  amount: z.number(),
  receiptUrl: z.string().max(500).optional(),
});

export const cashCountSchema = z.object({
  d5000: z.number().int().min(0),
  d1000: z.number().int().min(0),
  d500: z.number().int().min(0),
  d100: z.number().int().min(0),
  d75: z.number().int().min(0),
  d50: z.number().int().min(0),
  d20: z.number().int().min(0),
  d10: z.number().int().min(0),
});

export const voucherSchema = z.object({
  date: dateStringSchema,
  salesmanId: objectIdString,
  items: z.array(voucherItemSchema),
  credits: z.array(amountRowSchema),
  cashReceived: z.array(amountRowSchema),
  expenses: z.array(expenseRowSchema),
  other: z.array(amountRowSchema),
  cashCount: cashCountSchema,
  mcb: z.number(),
});

export type VoucherInput = z.infer<typeof voucherSchema>;

export const vouchersFilterSchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  salesmanId: objectIdString.optional(),
});

export type VouchersFilter = z.infer<typeof vouchersFilterSchema>;
