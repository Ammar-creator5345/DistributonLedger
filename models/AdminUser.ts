import { Schema, model, models, type InferSchemaType } from "mongoose";

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

export type AdminUserDoc = InferSchemaType<typeof adminUserSchema>;

export const AdminUser = models.AdminUser || model("AdminUser", adminUserSchema);
