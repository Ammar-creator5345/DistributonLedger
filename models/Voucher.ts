import { Schema, model, models, type InferSchemaType } from "mongoose";

const amountRowSchema = new Schema(
  {
    label: { type: String, default: "" },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const expenseRowSchema = new Schema(
  {
    label: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    receiptUrl: { type: String },
  },
  { _id: false }
);

const voucherItemSchema = new Schema(
  {
    skuId: { type: Schema.Types.ObjectId, ref: "Sku", required: true },
    opening: { type: Number, default: 0 },
    ret: { type: Number, default: 0 },
    closing: { type: Number, default: 0 },
    wholesaleQty: { type: Number, default: 0 },
  },
  { _id: false }
);

const cashCountSchema = new Schema(
  {
    d5000: { type: Number, default: 0 },
    d1000: { type: Number, default: 0 },
    d500: { type: Number, default: 0 },
    d100: { type: Number, default: 0 },
    d75: { type: Number, default: 0 },
    d50: { type: Number, default: 0 },
    d20: { type: Number, default: 0 },
    d10: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * `date` is stored as a plain "YYYY-MM-DD" string, not a Date. The source
 * application compares vouchers with lexicographic string comparison
 * (v.date < otherDate) to decide ordering for opening-stock autofill and
 * inventory math; keeping the same representation preserves that behavior
 * exactly and sidesteps timezone-shift bugs entirely (spec section 45).
 */
const voucherSchema = new Schema(
  {
    date: { type: String, required: true },
    salesmanId: { type: Schema.Types.ObjectId, ref: "Salesman", required: true },
    items: { type: [voucherItemSchema], default: [] },
    credits: { type: [amountRowSchema], default: [] },
    cashReceived: { type: [amountRowSchema], default: [] },
    expenses: { type: [expenseRowSchema], default: [] },
    other: { type: [amountRowSchema], default: [] },
    cashCount: { type: cashCountSchema, default: () => ({}) },
    mcb: { type: Number, default: 0 },
  },
  { timestamps: true }
);

voucherSchema.index({ salesmanId: 1, date: 1 });
voucherSchema.index({ date: 1 });
voucherSchema.index({ "items.skuId": 1 });

export type VoucherDoc = InferSchemaType<typeof voucherSchema>;

export const Voucher = models.Voucher || model("Voucher", voucherSchema);
