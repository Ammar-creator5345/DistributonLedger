"use client"

import * as React from "react"
import MuiButton from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import { cn } from "cn"

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

const sizeToHeight: Record<ButtonSize, number> = {
  default: 32,
  xs: 24,
  sm: 28,
  lg: 36,
  icon: 32,
  "icon-xs": 24,
  "icon-sm": 28,
  "icon-lg": 36,
}

function toMuiVariant(variant: ButtonVariant): "contained" | "outlined" | "text" {
  if (variant === "outline") return "outlined"
  if (variant === "link" || variant === "ghost") return "text"
  return "contained"
}

function toMuiColor(variant: ButtonVariant): "primary" | "secondary" | "error" | "inherit" {
  if (variant === "destructive") return "error"
  if (variant === "secondary") return "secondary"
  return "primary"
}

/**
 * Internal rewrite onto MUI Button/IconButton, keeping the same variant/size/asChild surface
 * every consumer already uses so no call sites need to change.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "color"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}) {
  const isIcon = size.startsWith("icon")
  const height = sizeToHeight[size]
  const muiVariant = toMuiVariant(variant)
  const muiColor = variant === "ghost" || variant === "link" ? "inherit" : toMuiColor(variant)

  const commonSx = {
    minHeight: height,
    borderRadius: "var(--radius-md)",
    ...(variant === "ghost" || variant === "link"
      ? { color: "var(--foreground)" }
      : {}),
    ...(variant === "link"
      ? { textDecoration: "underline", textUnderlineOffset: "4px", color: "var(--primary)", minWidth: 0, padding: 0 }
      : {}),
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>
    return (
      <MuiButton
        data-slot="button"
        variant={muiVariant}
        color={muiColor}
        size={height <= 28 ? "small" : height >= 36 ? "large" : "medium"}
        component={child.type as React.ElementType}
        className={cn("gap-1.5 normal-case", className, child.props.className as string)}
        sx={commonSx}
        {...child.props}
        {...props}
      />
    )
  }

  if (isIcon) {
    return (
      <IconButton
        data-slot="button"
        size={height <= 28 ? "small" : "medium"}
        color={muiColor === "inherit" ? "default" : muiColor}
        className={cn("rounded-lg", className)}
        sx={{ ...commonSx, width: height, height, borderRadius: "var(--radius-md)" }}
        {...(props as React.ComponentProps<typeof IconButton>)}
      >
        {children}
      </IconButton>
    )
  }

  return (
    <MuiButton
      data-slot="button"
      variant={muiVariant}
      color={muiColor}
      size={height <= 28 ? "small" : height >= 36 ? "large" : "medium"}
      className={cn("gap-1.5 normal-case", className)}
      sx={commonSx}
      {...(props as React.ComponentProps<typeof MuiButton>)}
    >
      {children}
    </MuiButton>
  )
}

/** Tailwind class string for non-<Button> elements (e.g. an <a> download link) styled to match. */
function buttonVariants({
  variant = "default",
  size = "default",
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50",
    variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
    variant === "outline" && "border border-border bg-background hover:bg-muted",
    variant === "secondary" && "bg-secondary text-secondary-foreground hover:opacity-90",
    variant === "ghost" && "hover:bg-muted",
    variant === "destructive" && "bg-destructive text-white hover:opacity-90",
    variant === "link" && "text-primary underline-offset-4 hover:underline",
    size.startsWith("icon")
      ? "size-8 p-0"
      : size === "sm"
        ? "h-7 px-2.5 text-[0.8rem]"
        : size === "lg"
          ? "h-9 px-3"
          : "h-8 px-3 py-1.5"
  )
}

export { Button, buttonVariants }
