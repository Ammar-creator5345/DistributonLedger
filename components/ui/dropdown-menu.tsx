"use client"

import * as React from "react"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Divider from "@mui/material/Divider"
import { cn } from "cn"

interface DropdownMenuContextValue {
  anchorEl: HTMLElement | null
  open: boolean
  setAnchorEl: (el: HTMLElement | null) => void
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenuCtx() {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) throw new Error("DropdownMenu parts must be used within <DropdownMenu>")
  return ctx
}

function DropdownMenu({ children }: { children?: React.ReactNode }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const value = React.useMemo(() => ({ anchorEl, open: !!anchorEl, setAnchorEl }), [anchorEl])
  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>
}

function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>
}) {
  void asChild
  const { setAnchorEl } = useDropdownMenuCtx()
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onClick?.(e)
      setAnchorEl(e.currentTarget)
    },
  })
}

function DropdownMenuContent({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end" | "center"
  className?: string
  sideOffset?: number
  children?: React.ReactNode
}) {
  const { anchorEl, open, setAnchorEl } = useDropdownMenuCtx()
  const horizontal = align === "end" ? "right" : align === "center" ? "center" : "left"
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: "bottom", horizontal }}
      transformOrigin={{ vertical: "top", horizontal }}
      slotProps={{ paper: { className: cn("min-w-[200px] py-1", className) } }}
    >
      {children}
    </Menu>
  )
}

function DropdownMenuItem({
  className,
  onClick,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof MenuItem> & { variant?: "default" | "destructive" }) {
  const { setAnchorEl } = useDropdownMenuCtx()
  return (
    <MenuItem
      data-slot="dropdown-menu-item"
      className={cn("gap-1.5 text-sm", variant === "destructive" && "text-destructive", className)}
      onClick={(e) => {
        onClick?.(e)
        setAnchorEl(null)
      }}
      {...props}
    >
      {children}
    </MenuItem>
  )
}

function DropdownMenuLabel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div data-slot="dropdown-menu-label" className={cn("px-3 py-1.5 text-xs text-muted-foreground", className)}>
      {children}
    </div>
  )
}

function DropdownMenuSeparator() {
  return <Divider className="my-1" />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
