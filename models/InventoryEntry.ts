import { Schema, model, models, type InferSchemaType } from "mongoose";

const inventoryEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    skuId: { type: Schema.Types.ObjectId, ref: "Sku", required: true },
    relatedSalesmanId: { type: Schema.Types.ObjectId, ref: "Salesman" },
    received: { type: Number, default: 0 },
    damage: { type: Number, default: 0 },
    unsaleableQty: { type: Number, default: 0 },
    unsaleableReason: { type: String },
    reference: { type: String },
  },
  { timestamps: true }
);

inventoryEntrySchema.index({ skuId: 1, date: 1 });
inventoryEntrySchema.index({ relatedSalesmanId: 1, skuId: 1, date: 1 });

export type InventoryEntryDoc = InferSchemaType<typeof inventoryEntrySchema>;

export const InventoryEntry =
  models.InventoryEntry || model("InventoryEntry", inventoryEntrySchema);
