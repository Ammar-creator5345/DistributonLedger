"use client";

import { useState } from "react";
import Popover from "@mui/material/Popover";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { CalendarIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
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
 * The visible field is our own plain <Input> (read-only, click-to-open) rather than MUI's
 * DatePicker/TextField — MUI's OutlinedInput has internal layout quirks that made it
 * impossible to pin to the exact same height as every other field. Clicking it opens a plain
 * MUI DateCalendar in a Popover; selecting a day fills the input and closes it. The
 * "YYYY-MM-DD" string in/out contract is unchanged, so no consumer needed to change.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
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
  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null);
  const selected = parseDateStr(value);
  const open = Boolean(anchorEl);

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        id={id}
        readOnly
        disabled={disabled}
        placeholder={placeholder}
        value={selected ? formatDate(value) : ""}
        onClick={(e) => {
          if (disabled) return;
          setAnchorEl(e.currentTarget);
        }}
        className="cursor-pointer pr-14 font-mono caret-transparent"
      />
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
        {clearable && value && (
          <button
            type="button"
            className="pointer-events-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Clear date"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
        <CalendarIcon className="size-4 text-muted-foreground" />
      </div>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { className: "mt-1" } }}
      >
        <DateCalendar
          value={selected}
          onChange={(date) => {
            if (date) onChange(formatDateStr(date));
            setAnchorEl(null);
          }}
        />
      </Popover>
    </div>
  );
}
