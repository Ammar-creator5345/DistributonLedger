"use client";

import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { cn } from "@/lib/utils";

function parseDateStr(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Internal rewrite onto MUI X's DatePicker — the string-based "YYYY-MM-DD" in/out contract is
 * preserved exactly so every consumer (reports, inventory, unsaleable, credit-book, voucher
 * form, vouchers table) keeps working untouched.
 */
export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
  clearable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  void placeholder;
  return (
    <MuiDatePicker
      value={parseDateStr(value)}
      onChange={(date) => onChange(date ? formatDateStr(date) : "")}
      disabled={disabled}
      format="dd MMM yyyy"
      className={cn("w-full", className)}
      sx={{
        width: "100%",
        "& .MuiOutlinedInput-root": { height: 32, boxSizing: "border-box" },
        "& input": { height: "100%", boxSizing: "border-box" },
      }}
      slotProps={{
        textField: {
          id,
          size: "small",
          fullWidth: true,
          className: "[&_input]:font-mono [&_input]:text-sm",
        },
        field: { clearable, onClear: () => onChange("") },
      }}
    />
  );
}
