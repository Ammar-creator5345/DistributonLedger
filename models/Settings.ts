import { Schema, model, models, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    businessName: { type: String, required: true, default: "Distribution Ledger" },
    subtitle: { type: String, default: "Distribution Ledger" },
    currency: { type: String, required: true, default: "Rs" },
    logoUrl: { type: String },
    /** Secondary Admin-panel gate, matching the source app's UI.adminUnlocked flow. Real
     * authorization is the session login (spec section 9) — this is UX parity, not security. */
    adminPassword: { type: String, required: true, default: "admin456" },
  },
  { timestamps: true }
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;

export const Settings = models.Settings || model("Settings", settingsSchema);
