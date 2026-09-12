import { Voucher } from "@/models/Voucher";
import { Salesman } from "@/models/Salesman";
import { buildCreditBook, type CreditBookPerson, type CreditBookRow } from "@/lib/calculations";

/**
 * Credit Book holds ONLY genuine Credit-given and Receiving/Payment transactions (each voucher's
 * "Credit given" and "Cash received" rows). Salesman Cash and MCB never appear here — spec
 * section 22 / source app comment in buildCreditBook.
 */
export async function getCreditBook(from?: string, to?: string): Promise<CreditBookPerson[]> {
  const query: Record<string, unknown> = {};
  if (from || to) {
    query.date = {};
    if (from) (query.date as Record<string, unknown>).$gte = from;
    if (to) (query.date as Record<string, unknown>).$lte = to;
  }

  const vouchers = await Voucher.find(query).select("date salesmanId credits cashReceived").lean();
  const salesmen = await Salesman.find().select("name").lean();
  const salesmanMap = new Map(salesmen.map((s) => [String(s._id), s.name]));

  const rows: CreditBookRow[] = [];
  for (const v of vouchers) {
    const salesmanName = salesmanMap.get(String(v.salesmanId)) ?? "—";
    for (const r of v.credits ?? []) {
      rows.push({ name: r.label ?? "", amount: Number(r.amount) || 0, kind: "credit", date: v.date, salesman: salesmanName });
    }
    for (const r of v.cashReceived ?? []) {
      rows.push({ name: r.label ?? "", amount: Number(r.amount) || 0, kind: "received", date: v.date, salesman: salesmanName });
    }
  }

  return buildCreditBook(rows);
}
