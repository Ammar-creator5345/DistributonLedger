import { z } from "zod";

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  subtitle: z.string().trim().max(200),
  currency: z.string().trim().min(1, "Currency symbol is required").max(10),
  logoUrl: z.string().max(500).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
