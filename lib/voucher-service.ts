import { Voucher } from "@/models/Voucher";
import { InventoryEntry } from "@/models/InventoryEntry";

/**
 * Opening-stock autofill for a NEW voucher: prevClosing + receivedSince, where prevClosing comes
 * from the salesman's single most-recent earlier voucher and receivedSince sums InventoryEntry
 * receipts between that voucher's date and this one (exclusive/exclusive on the earlier voucher's
 * date, inclusive up to but excluding the new voucher's date). Ported from the source app's
 * v1.126 optimized `autofillOpening` — deliberately reads only the ONE most recent prior voucher
 * (not a per-SKU scan across all vouchers) because every voucher created after a SKU exists always
 * carries an item for it. Never re-run for an existing (already saved) voucher — spec section 19.
 */
export async function computeOpeningAutofill(
  salesmanId: string,
  date: string,
  skuIds: string[],
  excludeVoucherId?: string
): Promise<Record<string, number>> {
  const mostRecent = await Voucher.findOne({
    salesmanId,
    date: { $lt: date },
    ...(excludeVoucherId ? { _id: { $ne: excludeVoucherId } } : {}),
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const closingMap = new Map<string, number>();
  if (mostRecent) {
    for (const item of mostRecent.items) {
      closingMap.set(String(item.skuId), Number(item.closing) || 0);
    }
  }
  const sinceDate = mostRecent ? mostRecent.date : "0000-00-00";

  const entries = await InventoryEntry.find({
    relatedSalesmanId: salesmanId,
    date: { $gt: sinceDate, $lt: date },
  })
    .select("skuId received")
    .lean();

  const receivedMap = new Map<string, number>();
  for (const entry of entries) {
    const key = String(entry.skuId);
    receivedMap.set(key, (receivedMap.get(key) ?? 0) + (Number(entry.received) || 0));
  }

  const result: Record<string, number> = {};
  for (const skuId of skuIds) {
    const prevClosing = closingMap.get(skuId) ?? 0;
    result[skuId] = prevClosing + (receivedMap.get(skuId) ?? 0);
  }
  return result;
}
