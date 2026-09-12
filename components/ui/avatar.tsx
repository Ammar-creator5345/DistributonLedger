"use client"

import * as React from "react"
import MuiAvatar from "@mui/material/Avatar"
import { cn } from "cn"

const sizeMap = { sm: 24, default: 32, lg: 40 } as const

function Avatar({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof MuiAvatar> & { size?: "default" | "sm" | "lg" }) {
  return (
    <MuiAvatar
      data-slot="avatar"
      data-size={size}
      className={cn("select-none bg-muted text-sm text-muted-foreground", className)}
      sx={{ width: sizeMap[size], height: sizeMap[size], fontSize: size === "sm" ? 11 : 13 }}
      {...props}
    >
      {children}
    </MuiAvatar>
  )
}

/** Compat no-op: MuiAvatar renders its `src`/children directly, so a separate Image slot isn't needed. */
function AvatarImage(props: React.ComponentProps<"img">) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className="aspect-square size-full rounded-full object-cover" {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
