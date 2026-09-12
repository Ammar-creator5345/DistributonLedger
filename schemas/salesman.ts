import { z } from "zod";

export const objectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

export const filerCategorySchema = z.enum(["", "Filer", "Non-Filer"]);

export const salesmanSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  filerCategory: filerCategorySchema.default(""),
  photoUrl: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export type SalesmanInput = z.infer<typeof salesmanSchema>;

export const salesmanImportRowSchema = z.object({
  name: z.string().trim().min(1, "Missing salesman name."),
  filerCategory: filerCategorySchema.default(""),
});

export type SalesmanImportRow = z.infer<typeof salesmanImportRowSchema>;
