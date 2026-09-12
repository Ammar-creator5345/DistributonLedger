import { Schema, model, models, type InferSchemaType } from "mongoose";

const skuSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["", "FMC", "NC"], default: "" },
    distRate: { type: Number, required: true, min: 0 },
    retailRate: { type: Number, required: true, min: 0 },
    wholesaleRate: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

skuSchema.index({ name: 1 });
skuSchema.index({ category: 1 });

export type SkuDoc = InferSchemaType<typeof skuSchema>;

export const Sku = models.Sku || model("Sku", skuSchema);
