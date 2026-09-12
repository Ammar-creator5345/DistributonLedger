"use client";

import type { UseFormRegister } from "react-hook-form";
import { DENOMINATIONS } from "@/types";
import type { CashCountResult } from "@/types";
import { formatMoney } from "@/lib/format";
import { SignedAmount } from "@/components/ledger/signed-amount";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VoucherInput } from "@/schemas/voucher";

export function CashCountPanel({
  register,
  cashCount,
  currency,
}: {
  register: UseFormRegister<VoucherInput>;
  cashCount: CashCountResult;
  currency: string;
}) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-lg font-semibold">Cash counting</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Denomination</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DENOMINATIONS.map((den, idx) => (
              <TableRow key={den}>
                <TableCell className="font-mono">{den}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="w-16 font-mono"
                    data-denom={den}
                    {...register(`cashCount.d${den}`, { valueAsNumber: true })}
                  />
                </TableCell>
                <TableCell className="font-mono font-tabular font-semibold text-primary">
                  {formatMoney(cashCount.breakdown[idx]?.amt ?? 0, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 max-w-[220px]">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="mcb">
          MCB deposit amount
        </label>
        <Input
          id="mcb"
          type="number"
          step="0.01"
          className="font-mono"
          data-bind-num="voucher.mcb"
          {...register("mcb", { valueAsNumber: true })}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-secondary p-4 sm:grid-cols-3 lg:grid-cols-5">
        <div>
          <div className="text-xs text-muted-foreground">Total (before MCB)</div>
          <div className="font-mono font-tabular text-base font-semibold">
            {formatMoney(cashCount.totalBeforeMcb, currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Physical cash</div>
          <div className="font-mono font-tabular text-base font-semibold">
            {formatMoney(cashCount.physical, currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Cash required</div>
          <div className="font-mono font-tabular text-base font-semibold">
            {formatMoney(cashCount.required, currency)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="font-mono font-tabular text-base font-semibold">{cashCount.status}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Plus / Less</div>
          <SignedAmount value={cashCount.diff} currency={currency} className="text-base" />
        </div>
      </div>
    </div>
  );
}
