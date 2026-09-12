"use client"

import * as React from "react"
import MuiTabs from "@mui/material/Tabs"
import MuiTab from "@mui/material/Tab"
import { cn } from "cn"

interface TabsContextValue {
  value?: string
  onValueChange?: (value: string) => void
}
const TabsContext = React.createContext<TabsContextValue>({})

function Tabs({
  value,
  onValueChange,
  className,
  children,
  ...props
}: {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentProps<"div">, "onChange">) {
  const ctx = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange])
  return (
    <TabsContext.Provider value={ctx}>
      <div data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/**
 * Marker only — never rendered directly. MUI's <Tabs> only wires up click/selection for
 * <Tab> elements that are its *direct* children (it walks `props.children` looking for the
 * Tab type to clone `selected`/`onChange` into); a <TabsTrigger> wrapper around <Tab> broke
 * that, so clicking a tab did nothing. TabsList below walks these marker elements itself and
 * renders real <MuiTab>s directly, so MUI sees genuine Tab children.
 */
function TabsTrigger(_props: { value: string; children?: React.ReactNode; className?: string; disabled?: boolean }) {
  return null
}
TabsTrigger.displayName = "TabsTrigger"

function TabsList({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { value, onValueChange } = React.useContext(TabsContext)
  const tabs: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || child.type !== TabsTrigger) return
    const props = child.props as { value: string; children?: React.ReactNode; className?: string; disabled?: boolean }
    tabs.push(
      <MuiTab
        key={props.value}
        data-slot="tabs-trigger"
        value={props.value}
        label={props.children}
        disabled={props.disabled}
        disableRipple
        className={cn(props.className)}
      />
    )
  })
  return (
    <MuiTabs
      data-slot="tabs-list"
      value={value ?? false}
      onChange={(_, v) => onValueChange?.(v)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      className={cn("min-h-0 border-b border-border", className)}
    >
      {tabs}
    </MuiTabs>
  )
}

function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children?: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return (
    <div data-slot="tabs-content" className={cn("flex-1 text-sm outline-none", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
