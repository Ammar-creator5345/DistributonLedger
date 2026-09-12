import { InventoryEntry } from "@/models/InventoryEntry";
import { InventoryOpeningBase } from "@/models/InventoryOpeningBase";
import { Voucher } from "@/models/Voucher";
import { computeInventoryMovement, computeInventoryOpening, computeLine } from "@/lib/calculations";
import type { InventoryMovement } from "@/types";

interface VoucherItemLean {
  skuId: unknown;
  opening?: number;
  ret?: number;
  closing?: number;
  wholesaleQty?: number;
}

/**
 * Movement for a set of SKUs over [from, to], ported from the source app's
 * inventoryOpening/inventoryMovement (spec section 20). Sale figures come
 * from computeLine (opening-ret-closing), which doesn't need SKU rates, so
 * vouchers are read once and reused for every SKU.
 */
export async function getInventoryMovementForSkus(
  skuIds: string[],
  from: string,
  to: string
): Promise<Record<string, InventoryMovement>> {
  const skuIdSet = new Set(skuIds);

  const [bases, entriesBefore, entriesInRange, vouchersBefore, vouchersInRange] = await Promise.all([
    InventoryOpeningBase.find({ skuId: { $in: skuIds } }).lean(),
    InventoryEntry.find({ skuId: { $in: skuIds }, date: { $lt: from } })
      .select("skuId received damage unsaleableQty")
      .lean(),
    InventoryEntry.find({ skuId: { $in: skuIds }, date: { $gte: from, $lte: to } })
      .select("skuId received damage unsaleableQty")
      .lean(),
    Voucher.find({ date: { $lt: from }, "items.skuId": { $in: skuIds } }).select("items").lean(),
    Voucher.find({ date: { $gte: from, $lte: to }, "items.skuId": { $in: skuIds } })
      .select("items")
      .lean(),
  ]);

  const baseMap = new Map<string, number>(bases.map((b) => [String(b.skuId), b.qty]));

  function sumEntries(entries: { skuId: unknown; received?: number; damage?: number; unsaleableQty?: number }[]) {
    const received = new Map<string, number>();
    const damage = new Map<string, number>();
    const unsaleable = new Map<string, number>();
    for (const e of entries) {
      const key = String(e.skuId);
      received.set(key, (received.get(key) ?? 0) + (Number(e.received) || 0));
      damage.set(key, (damage.get(key) ?? 0) + (Number(e.damage) || 0));
      unsaleable.set(key, (unsaleable.get(key) ?? 0) + (Number(e.unsaleableQty) || 0));
    }
    return { received, damage, unsaleable };
  }

  function sumSales(vouchers: { items: VoucherItemLean[] }[]) {
    const sale = new Map<string, number>();
    for (const v of vouchers) {
      for (const it of v.items) {
        const key = String(it.skuId);
        if (!skuIdSet.has(key)) continue;
        const line = computeLine(
          {
            skuId: key,
            opening: it.opening ?? 0,
            ret: it.ret ?? 0,
            closing: it.closing ?? 0,
            wholesaleQty: it.wholesaleQty ?? 0,
          },
          undefined
        );
        sale.set(key, (sale.get(key) ?? 0) + line.sale);
      }
    }
    return sale;
  }

  const before = sumEntries(entriesBefore);
  const inRange = sumEntries(entriesInRange);
  const saleBefore = sumSales(vouchersBefore);
  const saleInRange = sumSales(vouchersInRange);

  const result: Record<string, InventoryMovement> = {};
  for (const skuId of skuIds) {
    const entriesNetBefore =
      (before.received.get(skuId) ?? 0) - (before.damage.get(skuId) ?? 0) - (before.unsaleable.get(skuId) ?? 0);
    const opening = computeInventoryOpening(baseMap.get(skuId) ?? 0, entriesNetBefore, saleBefore.get(skuId) ?? 0);
    result[skuId] = computeInventoryMovement(
      opening,
      inRange.received.get(skuId) ?? 0,
      saleInRange.get(skuId) ?? 0,
      inRange.damage.get(skuId) ?? 0,
      inRange.unsaleable.get(skuId) ?? 0
    );
  }
  return result;
}
