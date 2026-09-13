"use client"

import * as React from "react"
import MuiSelect from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import ListSubheader from "@mui/material/ListSubheader"
import Divider from "@mui/material/Divider"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import { cn } from "cn"

/**
 * Compat shim: consumers still write the shadcn/Radix compound shape
 * (<Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/></SelectContent></Select>),
 * but the actual rendering is a single real MUI <Select> — MUI already opens on click and closes
 * on selection (no native <select> involved), which is what "manual/controlled" selection means
 * here. `SelectTrigger`/`SelectContent`/`SelectGroup`/etc. are inert marker components: `Select`
 * walks its children once to build the list of MUI `MenuItem`s and to read the trigger's
 * className/size/placeholder, so none of the ~10 call sites using this shape needed to change.
 */

interface SelectItemProps extends React.ComponentProps<"div"> {
  value: string
  disabled?: boolean
}
function SelectItem(props: SelectItemProps) {
  void props
  return null
}
SelectItem.displayName = "SelectItem"

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
SelectGroup.displayName = "SelectGroup"

function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
SelectLabel.displayName = "SelectLabel"

function SelectSeparator() {
  return null
}
SelectSeparator.displayName = "SelectSeparator"

function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
SelectContent.displayName = "SelectContent"

function SelectValue({ placeholder }: { placeholder?: string }) {
  void placeholder
  return null
}
SelectValue.displayName = "SelectValue"

function SelectTrigger({
  children,
}: {
  className?: string
  size?: "sm" | "default"
  id?: string
  children?: React.ReactNode
}) {
  return <>{children}</>
}
SelectTrigger.displayName = "SelectTrigger"

type MenuNode = { key: string; value: string; label: React.ReactNode; disabled?: boolean } | { key: string; kind: "label"; label: React.ReactNode } | { key: string; kind: "separator" }

function walk(children: React.ReactNode, out: MenuNode[], labelMap: Map<string, React.ReactNode>) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const props = child.props as Record<string, unknown>
    if (child.type === SelectContent || child.type === SelectGroup) {
      walk(props.children as React.ReactNode, out, labelMap)
      return
    }
    if (child.type === SelectItem) {
      const value = props.value as string
      labelMap.set(value, props.children as React.ReactNode)
      out.push({ key: value, value, label: props.children as React.ReactNode, disabled: props.disabled as boolean | undefined })
      return
    }
    if (child.type === SelectLabel) {
      out.push({ key: `label-${out.length}`, kind: "label", label: props.children as React.ReactNode })
      return
    }
    if (child.type === SelectSeparator) {
      out.push({ key: `sep-${out.length}`, kind: "separator" })
    }
  })
}

function findTriggerMeta(children: React.ReactNode): {
  className?: string
  size: "sm" | "default"
  id?: string
  placeholder?: string
} {
  let className: string | undefined
  let size: "sm" | "default" = "default"
  let id: string | undefined
  let placeholder: string | undefined
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== SelectTrigger) return
    const props = child.props as Record<string, unknown>
    className = props.className as string | undefined
    size = (props.size as "sm" | "default" | undefined) ?? "default"
    id = props.id as string | undefined
    React.Children.forEach(props.children as React.ReactNode, (inner) => {
      if (React.isValidElement(inner) && inner.type === SelectValue) {
        placeholder = (inner.props as Record<string, unknown>).placeholder as string | undefined
      }
    })
  })
  return { className, size, id, placeholder }
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
  children?: React.ReactNode
}

function Select({ value, defaultValue, onValueChange, disabled, name, children }: SelectProps) {
  const { items, labelMap } = React.useMemo(() => {
    const out: MenuNode[] = []
    const map = new Map<string, React.ReactNode>()
    walk(children, out, map)
    return { items: out, labelMap: map }
  }, [children])
  const { className, id, placeholder } = React.useMemo(() => findTriggerMeta(children), [children])

  return (
    <MuiSelect
      id={id}
      value={value ?? ""}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value as string)}
      disabled={disabled}
      name={name}
      displayEmpty
      size="small"
      IconComponent={KeyboardArrowDownRoundedIcon}
      renderValue={(v) => {
        const selected = v as string
        if (!selected) return <span className="text-muted-foreground">{placeholder}</span>
        return labelMap.get(selected) ?? selected
      }}
      className={cn("w-full rounded-md text-sm", className)}
      sx={{
        height: 45,
        minHeight: 45,
        maxHeight: 45,
        boxSizing: "border-box",
        "& .MuiSelect-select": {
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
        },
      }}
      MenuProps={{ slotProps: { paper: { className: "max-h-72" } } }}
    >
      {items.map((item) => {
        if ("kind" in item && item.kind === "label") {
          return <ListSubheader key={item.key}>{item.label}</ListSubheader>
        }
        if ("kind" in item && item.kind === "separator") {
          return <Divider key={item.key} className="my-1" />
        }
        const menuItem = item as Extract<MenuNode, { value: string }>
        return (
          <MenuItem key={menuItem.key} value={menuItem.value} disabled={menuItem.disabled}>
            {menuItem.label}
          </MenuItem>
        )
      })}
    </MuiSelect>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
