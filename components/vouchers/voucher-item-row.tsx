"use client";

import type { UseFormRegister } from "react-hook-form";
import { formatMoney, formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { VoucherInput } from "@/schemas/voucher";
import type { LineCalculation } from "@/types";

export function VoucherItemRow({
  register,
  index,
  skuId,
  skuName,
  line,
  currency,
}: {
  register: UseFormRegister<VoucherInput>;
  index: number;
  skuId: string;
  skuName: string;
  line: LineCalculation;
  currency: string;
}) {
  return (
    <TableRow>
      <TableCell className="min-w-[180px] font-medium">{skuName}</TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-24 font-mono"
          data-item={skuId}
          data-field="opening"
          {...register(`items.${index}.opening`, { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-24 font-mono"
          data-item={skuId}
          data-field="ret"
          {...register(`items.${index}.ret`, { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-24 font-mono"
          data-item={skuId}
          data-field="closing"
          {...register(`items.${index}.closing`, { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell className="font-mono font-tabular font-semibold text-primary">
        {formatNumber(line.sale)}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-24 font-mono"
          data-item={skuId}
          data-field="wholesaleQty"
          {...register(`items.${index}.wholesaleQty`, { valueAsNumber: true })}
        />
      </TableCell>
      <TableCell className="font-mono font-tabular font-semibold text-primary">
        {formatNumber(line.retailQty)}
      </TableCell>
      <TableCell className="font-mono font-tabular font-semibold text-primary">
        {formatMoney(line.totalAmt, currency)}
      </TableCell>
    </TableRow>
  );
}
