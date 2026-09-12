"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { apiPut } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OpeningStockPanel({
  skus,
  initialBase,
}: {
  skus: { _id: string; name: string }[];
  initialBase: Record<string, number>;
}) {
  const [base, setBase] = useState(initialBase);

  async function saveBase(skuId: string, qty: number) {
    try {
      await apiPut("/api/inventory/opening-base", { skuId, qty });
      setBase((prev) => ({ ...prev, [skuId]: qty }));
    } catch {
      toast.error("Could not save opening stock.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Inventory — opening stock</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Set each SKU&apos;s very first opening balance once. After that, opening/closing carry
          forward automatically — this table only matters for a brand-new SKU or your initial
          setup.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Opening base qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="max-w-[160px] font-mono"
                      defaultValue={base[s._id] ?? 0}
                      onBlur={(e) => saveBase(s._id, Number(e.target.value) || 0)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
