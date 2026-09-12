import MuiSkeleton from "@mui/material/Skeleton"
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<typeof MuiSkeleton>) {
  return (
    <MuiSkeleton
      data-slot="skeleton"
      variant="rounded"
      animation="pulse"
      className={cn("bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
