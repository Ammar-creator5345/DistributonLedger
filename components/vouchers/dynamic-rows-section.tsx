"use client";

import type { UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import AddIcon from "@mui/icons-material/Add";
import type { VoucherInput } from "@/schemas/voucher";

type SectionName = "credits" | "cashReceived" | "expenses" | "other";

/** Purely presentational — the field array lives in the parent so a single keyboard handler
 * (Ctrl+L / Enter navigation, spec section 29) can append rows without a second, out-of-sync
 * useFieldArray instance for the same field name. */
export function DynamicRowsSection({
  register,
  listName,
  title,
  placeholder,
  fields,
  onAddRow,
  onRemoveRow,
}: {
  register: UseFormRegister<VoucherInput>;
  listName: SectionName;
  title: string;
  placeholder: string;
  fields: { id: string }[];
  onAddRow: () => void;
  onRemoveRow: (idx: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
          <AddIcon fontSize="small" /> Add row
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          No entries yet. Press Ctrl+L in this section to add a row.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{placeholder}</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, idx) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input
                      placeholder={placeholder}
                      data-list={listName}
                      data-idx={idx}
                      data-field="label"
                      {...register(`${listName}.${idx}.label`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 font-mono"
                      data-list={listName}
                      data-idx={idx}
                      data-field="amount"
                      {...register(`${listName}.${idx}.amount`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove row"
                      onClick={() => onRemoveRow(idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
