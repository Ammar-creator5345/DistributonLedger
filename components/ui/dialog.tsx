"use client"

import * as React from "react"
import MuiDialog from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import CloseIcon from "@mui/icons-material/Close"
import { cn } from "cn"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const DialogContext = React.createContext<DialogContextValue | null>(null)

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const ctx = React.useMemo(
    () => ({ open: !!open, onOpenChange: onOpenChange ?? (() => {}) }),
    [open, onOpenChange]
  )
  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>
}

function useDialogCtx() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog parts must be used within <Dialog>")
  return ctx
}

function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
}) {
  void asChild
  const { onOpenChange } = useDialogCtx()
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e)
      onOpenChange(true)
    },
  })
}

function DialogClose({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
}) {
  void asChild
  const { onOpenChange } = useDialogCtx()
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e)
      onOpenChange(false)
    },
  })
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
}) {
  const { open, onOpenChange } = useDialogCtx()
  return (
    <MuiDialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { className: cn("relative gap-5 p-5", className) } }}
    >
      {children}
      {showCloseButton && (
        <IconButton
          size="small"
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2"
          aria-label="Close"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </MuiDialog>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-2xl bg-muted/40 p-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="dialog-title" className={cn("font-heading text-lg leading-none font-bold", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
