import * as React from "react"
import { styled, alpha } from "@mui/material/styles"
import { cn } from "cn"

/**
 * A styled native <input> (MUI's `styled()` API, not a compound TextField/OutlinedInput).
 * Several consumers (the voucher form's keyboard navigation, react-hook-form's `register()`)
 * rely on every prop — including `ref` and `data-*` attributes — landing on the real DOM
 * <input> so `document.querySelector('[data-item]...')` and `.focus()/.select()` keep working;
 * MUI's compound input components wrap the <input> in a container div and don't guarantee that.
 */
const StyledInput = styled("input")(({ theme }) => ({
  boxSizing: "border-box",
  height: 32,
  width: "100%",
  minWidth: 0,
  borderRadius: "var(--radius-md)",
  border: `1px solid ${theme.palette.divider}`,
  background: "transparent",
  padding: "4px 10px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  color: theme.palette.text.primary,
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease",
  "&::placeholder": { color: theme.palette.text.secondary },
  "&:hover:not(:disabled)": { borderColor: alpha(theme.palette.secondary.main, 0.6) },
  "&:focus-visible": {
    borderColor: theme.palette.secondary.main,
  },
  "&:disabled": {
    pointerEvents: "none",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  "&[aria-invalid=true]": {
    borderColor: theme.palette.error.main,
  },
  "&[type=file]": {
    paddingTop: 4,
  },
}))

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input(
  { className, type, ...props },
  ref
) {
  return <StyledInput ref={ref} type={type} data-slot="input" className={cn(className)} {...props} />
})

export { Input }
