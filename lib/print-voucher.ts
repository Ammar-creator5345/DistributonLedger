import { formatDate, formatMoney, formatSigned } from "@/lib/format";
import type { CashCountResult, VoucherTotals } from "@/types";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c];
  });
}

/** Builds the same print-friendly voucher document as the source app — spec section 32. */
export function buildVoucherPrintHtml(params: {
  businessName: string;
  currency: string;
  salesmanName: string;
  date: string;
  skuLines: { name: string; qty: number; amount: number }[];
  totals: VoucherTotals;
  cashCount: CashCountResult;
}): string {
  const { businessName, currency, salesmanName, date, skuLines, totals, cashCount } = params;
  const money = (n: number) => formatMoney(n, currency);

  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Voucher</title><style>';
  html += "@page{ size:A4 portrait; margin:14mm; }";
  html +=
    "*{box-sizing:border-box;} html,body{margin:0;} body{font-family:Arial,sans-serif; padding:0; color:#111; width:100%;} h1{font-size:18px; margin:0 0 2px; word-break:break-word;} .sub{color:#555; font-size:12px; margin-bottom:16px;}";
  html +=
    "table{width:100%; max-width:100%; border-collapse:collapse; margin-bottom:16px; table-layout:fixed;} th,td{border:1px solid #999; padding:6px 8px; font-size:12px; text-align:left; word-break:break-word; overflow-wrap:break-word;}";
  html +=
    ".summary td:first-child{font-weight:bold;} .summary td:last-child{text-align:right;} .final{background:#eee; font-weight:bold;}";
  html += "@media print{ body{ width:auto; } table{ page-break-inside:auto; } tr{ page-break-inside:avoid; } }";
  html += "</style></head><body>";
  html += `<h1>${escapeHtml(businessName)}</h1>`;
  html += `<div class="sub">Voucher — ${escapeHtml(salesmanName)} — ${formatDate(date)}</div>`;
  html += "<table><thead><tr><th>SKU</th><th>Qty</th><th>Amount</th></tr></thead><tbody>";
  skuLines.forEach((l) => {
    html += `<tr><td>${escapeHtml(l.name)}</td><td>${l.qty}</td><td>${money(l.amount)}</td></tr>`;
  });
  if (!skuLines.length) html += '<tr><td colspan="3">No sales recorded.</td></tr>';
  html += "</tbody></table>";
  html += '<table class="summary"><tbody>';
  html += `<tr><td>Sales Amount</td><td>${money(totals.saleAmt)}</td></tr>`;
  html += `<tr><td>Credit</td><td>${money(totals.credit)}</td></tr>`;
  html += `<tr><td>Receiving (cash received)</td><td>${money(totals.cash)}</td></tr>`;
  html += `<tr><td>Other</td><td>${money(totals.other)}</td></tr>`;
  html += `<tr><td>Expenses</td><td>${money(totals.expense)}</td></tr>`;
  html += `<tr class="final"><td>Total</td><td>${money(cashCount.totalBeforeMcb)}</td></tr>`;
  html += `<tr><td>MCB</td><td>${money(cashCount.mcb)}</td></tr>`;
  html += `<tr class="final"><td>Cash Required</td><td>${money(cashCount.required)}</td></tr>`;
  html += `<tr><td>Physical Cash</td><td>${money(cashCount.physical)}</td></tr>`;
  html += `<tr class="final"><td>Difference (${cashCount.status})</td><td style="color:${cashCount.diff >= 0 ? "#1F6B34" : "#A13D3D"}">${formatSigned(cashCount.diff, currency)}</td></tr>`;
  html += "</tbody></table>";
  html += "</body></html>";
  return html;
}

export function openPrintWindow(html: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
  return true;
}
