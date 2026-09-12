import { z } from "zod";

export const skuCategorySchema = z.enum(["", "FMC", "NC"]);

export const skuSchema = z.object({
  name: z.string().trim().min(1, "SKU name is required").max(200),
  category: skuCategorySchema,
  distRate: z.number({ error: "Distributor rate is required" }).min(0, "Must be 0 or more"),
  retailRate: z.number({ error: "Retail rate is required" }).min(0, "Must be 0 or more"),
  wholesaleRate: z.number({ error: "Wholesale rate is required" }).min(0, "Must be 0 or more"),
  imageUrl: z.string().max(500).optional(),
});

export type SkuInput = z.infer<typeof skuSchema>;

export const skuImportRowSchema = z.object({
  name: z.string().trim().min(1, "Missing SKU name."),
  category: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => (v === "FMC" || v === "NC" ? v : ""))
    .pipe(skuCategorySchema),
  distRate: z.number().min(0, "Invalid Distributor rate."),
  retailRate: z.number().min(0, "Invalid Retail rate."),
  wholesaleRate: z.number().min(0, "Invalid Wholesale rate."),
});

export type SkuImportRow = z.infer<typeof skuImportRowSchema>;
