export type FilerCategory = "Filer" | "Non-Filer" | "";
export type SkuCategory = "FMC" | "NC" | "";
export type UnsaleableCategory = "retail" | "wholesale" | "distributor";
export type CashStatus = "Plus" | "Less" | "Exact";

export interface AmountRow {
  label: string;
  amount: number;
}

export interface VoucherItemInput {
  skuId: string;
  opening: number;
  ret: number;
  closing: number;
  wholesaleQty: number;
}

export interface CashCount {
  d5000: number;
  d1000: number;
  d500: number;
  d100: number;
  d75: number;
  d50: number;
  d20: number;
  d10: number;
}

export const DENOMINATIONS = [5000, 1000, 500, 100, 75, 50, 20, 10] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

export interface SkuLike {
  id: string;
  name: string;
  distRate: number;
  retailRate: number;
  wholesaleRate: number;
  category?: SkuCategory;
}

/** Result of computeLine() for a single voucher item. Pure/derived — never stored. */
export interface LineCalculation {
  opening: number;
  ret: number;
  closing: number;
  sale: number;
  wholesaleQty: number;
  retailQty: number;
  retailAmt: number;
  wholesaleAmt: number;
  retailProfit: number;
  wholesaleProfit: number;
  costAmt: number;
  totalAmt: number;
  profit: number;
}

export interface VoucherTotals {
  saleQty: number;
  saleAmt: number;
  profit: number;
  credit: number;
  cash: number;
  expense: number;
  other: number;
}

export interface CashCountResult {
  breakdown: { den: number; qty: number; amt: number }[];
  physical: number;
  totalBeforeMcb: number;
  mcb: number;
  required: number;
  diff: number;
  status: CashStatus;
}

export interface InventoryMovement {
  opening: number;
  received: number;
  sale: number;
  damage: number;
  unsaleable: number;
  closing: number;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
