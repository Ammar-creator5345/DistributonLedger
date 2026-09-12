"use client"

import * as React from "react"
import Divider from "@mui/material/Divider"
import { cn } from "cn"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: Omit<React.ComponentProps<typeof Divider>, "orientation"> & {
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <Divider
      data-slot="separator"
      orientation={orientation}
      flexItem={orientation === "vertical"}
      className={cn("border-border", className)}
      {...props}
    />
  )
}

export { Separator }
