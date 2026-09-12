"use client"

import * as React from "react"
import MuiTable from "@mui/material/Table"
import MuiTableHead from "@mui/material/TableHead"
import MuiTableBody from "@mui/material/TableBody"
import MuiTableFooter from "@mui/material/TableFooter"
import MuiTableRow from "@mui/material/TableRow"
import MuiTableCell from "@mui/material/TableCell"
import { cn } from "cn"

function Table({ className, ...props }: React.ComponentProps<typeof MuiTable>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <MuiTable data-slot="table" size="small" className={cn("w-full text-sm", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<typeof MuiTableHead>) {
  return <MuiTableHead data-slot="table-header" className={cn(className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<typeof MuiTableBody>) {
  return <MuiTableBody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<typeof MuiTableFooter>) {
  return (
    <MuiTableFooter
      data-slot="table-footer"
      className={cn("border-t border-border bg-muted/50 font-medium", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<typeof MuiTableRow>) {
  return (
    <MuiTableRow
      data-slot="table-row"
      hover
      className={cn("border-b border-border", className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<typeof MuiTableCell>) {
  return (
    <MuiTableCell
      component="th"
      data-slot="table-head"
      className={cn("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<typeof MuiTableCell>) {
  return (
    <MuiTableCell
      data-slot="table-cell"
      className={cn("p-2 align-middle whitespace-nowrap", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
