import { Schema, model, models, type InferSchemaType } from "mongoose";

const inventoryOpeningBaseSchema = new Schema(
  {
    skuId: { type: Schema.Types.ObjectId, ref: "Sku", required: true, unique: true },
    qty: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type InventoryOpeningBaseDoc = InferSchemaType<typeof inventoryOpeningBaseSchema>;

export const InventoryOpeningBase =
  models.InventoryOpeningBase || model("InventoryOpeningBase", inventoryOpeningBaseSchema);
