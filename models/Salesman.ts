import { Schema, model, models, type InferSchemaType } from "mongoose";

const salesmanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    filerCategory: {
      type: String,
      enum: ["", "Filer", "Non-Filer"],
      default: "",
    },
    photoUrl: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

salesmanSchema.index({ name: 1 });
salesmanSchema.index({ active: 1 });

export type SalesmanDoc = InferSchemaType<typeof salesmanSchema>;

export const Salesman = models.Salesman || model("Salesman", salesmanSchema);
