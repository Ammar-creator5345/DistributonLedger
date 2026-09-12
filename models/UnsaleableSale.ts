import { Schema, model, models, type InferSchemaType } from "mongoose";

const unsaleableSaleSchema = new Schema(
  {
    date: { type: String, required: true },
    skuId: { type: Schema.Types.ObjectId, ref: "Sku", required: true },
    category: {
      type: String,
      enum: ["retail", "wholesale", "distributor"],
      required: true,
    },
    qty: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

unsaleableSaleSchema.index({ date: 1 });
unsaleableSaleSchema.index({ skuId: 1 });

export type UnsaleableSaleDoc = InferSchemaType<typeof unsaleableSaleSchema>;

export const UnsaleableSale =
  models.UnsaleableSale || model("UnsaleableSale", unsaleableSaleSchema);
