"use client"

import * as React from "react"
import MuiDialog from "@mui/material/Dialog"
import MuiDialogTitle from "@mui/material/DialogTitle"
import MuiDialogContent from "@mui/material/DialogContent"
import MuiDialogContentText from "@mui/material/DialogContentText"
import MuiDialogActions from "@mui/material/DialogActions"
import { Button } from "@/components/ui/button"

/**
 * Shared replacement for the 4 near-identical shadcn AlertDialog "delete this?" confirmations
 * (admin salesmen/SKU panels, unsaleable log, vouchers table) — one MUI Dialog-backed component
 * instead of 4 separate rewrites.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <MuiDialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { className: "gap-0 rounded-2xl" } }}
    >
      <MuiDialogTitle className="font-heading! text-base! font-medium!">{title}</MuiDialogTitle>
      {description && (
        <MuiDialogContent>
          <MuiDialogContentText className="text-sm! text-muted-foreground!">{description}</MuiDialogContentText>
        </MuiDialogContent>
      )}
      <MuiDialogActions className="gap-2 border-t border-border bg-muted/40 p-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}
        >
          {confirmLabel}
        </Button>
      </MuiDialogActions>
    </MuiDialog>
  )
}
